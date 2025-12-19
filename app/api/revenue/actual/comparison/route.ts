import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    try {
        // 1. Fetch SBUs
        const sbus = await query(`SELECT id, code, name FROM master_sbu ORDER BY code`);

        // 2. Fetch Weights for Year
        const weightResult = await query(`SELECT * FROM master_revenue_weight WHERE year = $1`, [year]);
        let weights = [5, 10, 15, 20, 25, 40, 45, 55, 65, 80, 90, 100];
        if (weightResult.length > 0) {
            const w = weightResult[0];
            weights = [
                Number(w.jan), Number(w.feb), Number(w.mar), Number(w.apr),
                Number(w.may), Number(w.jun), Number(w.jul), Number(w.aug),
                Number(w.sep), Number(w.oct), Number(w.nov), Number(w.dec)
            ];
        }

        // 3. Fetch Annual Targets (Using columns based on DB inspection)
        const targetResult = await query(`
            SELECT sbu_id, target_rkap, target_beyond_rkap, target_komitmen 
            FROM revenue_target_yearly 
            WHERE year = $1
        `, [year]);

        // Map targets by SBU -> Category -> Amount
        const targetMap: Record<number, Record<string, number>> = {};
        targetResult.forEach((row: any) => {
            if (!targetMap[row.sbu_id]) targetMap[row.sbu_id] = {};
            targetMap[row.sbu_id]['RKAP'] = Number(row.target_rkap || 0);
            targetMap[row.sbu_id]['BEYOND'] = Number(row.target_beyond_rkap || 0);
            targetMap[row.sbu_id]['COMMITMENT'] = Number(row.target_komitmen || 0);
        });

        // 4. Fetch Monthly Actuals
        const actualResult = await query(`
            SELECT 
                a.sbu_id, 
                m.month,
                a.type_pendapatan,
                a.amount
            FROM revenue_actual_monthly a
            JOIN master_time_month m ON a.time_month_id = m.id
            WHERE m.year = $1
        `, [year]);

        // Map Actuals by SBU -> Month (1-12) -> Type -> Amount
        const actualMap: Record<number, Record<number, Record<string, number>>> = {};
        actualResult.forEach((row: any) => {
            if (!actualMap[row.sbu_id]) actualMap[row.sbu_id] = {};
            if (!actualMap[row.sbu_id][row.month]) actualMap[row.sbu_id][row.month] = { NR: 0, CO: 0, TOTAL: 0 };

            // Assuming we sum NR + CO for "Actual" comparison against Target RPKA/Beyond
            // If type is NR or CO, add to TOTAL
            if (['NR', 'CO'].includes(row.type_pendapatan)) {
                actualMap[row.sbu_id][row.month].TOTAL += Number(row.amount);
            }
            actualMap[row.sbu_id][row.month][row.type_pendapatan as string] = Number(row.amount);
        });

        // 5. Construct Response Data
        // Structure: SBU -> rows: [RKAP, Beyond, Commitment] -> columns: Jan..Dec (Cumulative Actual vs Cumulative Target)

        const comparisonData = sbus.map((sbu: any) => {
            const sbuTargets = targetMap[sbu.id] || {};
            const sbuActuals = actualMap[sbu.id] || {};

            // Helper to calculate row data
            const calculateRow = (targetType: string, annualTarget: number) => {
                let cumulativeActual = 0;
                return Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const weight = weights[i];

                    // Target Cumulative
                    const targetCumulative = annualTarget * (weight / 100);

                    // Actual for this month
                    const monthlyActual = sbuActuals[month]?.TOTAL || 0;
                    cumulativeActual += monthlyActual;

                    // Achievement %
                    const achievementPct = targetCumulative > 0 ? (cumulativeActual / targetCumulative) * 100 : 0;

                    return {
                        month,
                        weight,
                        targetCumulative,
                        monthlyActual,
                        cumulativeActual,
                        achievementPct
                    };
                });
            };

            return {
                sbu: sbu,
                rkap: calculateRow('RKAP', sbuTargets['RKAP'] || 0),
                beyond: calculateRow('BEYOND', sbuTargets['BEYOND'] || 0), // Assumes 'BEYOND' is the key
                commitment: calculateRow('COMMITMENT', sbuTargets['COMMITMENT'] || 0), // Assumes 'COMMITMENT' key
            };
        });

        return NextResponse.json({
            weights,
            data: comparisonData
        });

    } catch (error) {
        console.error("Error fetching comparison:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
