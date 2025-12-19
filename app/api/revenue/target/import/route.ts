import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const year = Number(formData.get("year")) || new Date().getFullYear();

        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheetName = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) return NextResponse.json({ message: "Empty file" });

        // Fetch Weights for Distribution
        const weightResult = await query(`SELECT * FROM master_revenue_weight WHERE year = $1`, [year]);
        let weights = [5, 10, 15, 20, 25, 40, 45, 55, 65, 80, 90, 100];
        if (weightResult.length > 0) {
            const w = weightResult[0];
            weights = [w.jan, w.feb, w.mar, w.apr, w.may, w.jun, w.jul, w.aug, w.sep, w.oct, w.nov, w.dec].map(Number);
        }

        const monthIdsResult = await query(`SELECT id, month FROM master_time_month WHERE year = $1 ORDER BY month`, [year]);
        if (monthIdsResult.length !== 12) {
            return NextResponse.json({ error: `Master time data incomplete for ${year}` }, { status: 500 });
        }

        // Process each row
        for (const row of rows) {
            const sbuCode = row['SBU Code'];
            if (!sbuCode || sbuCode === 'EXAMPLE') continue;

            // Find SBU ID
            const sbuRes = await query(`SELECT id FROM master_sbu WHERE code = $1`, [sbuCode]);
            if (sbuRes.length === 0) continue;
            const sbuId = sbuRes[0].id;

            const rkap = Number(row['Target RKAP'] || 0);
            const komitmen = Number(row['Target Komitmen'] || 0);
            const beyond = Number(row['Target Beyond'] || 0);
            const co = Number(row['CO'] || 0);
            const nr = Number(row['NR'] || 0);

            // 1. Upsert Yearly
            const categories = [
                { key: 'RKAP', val: rkap },
                { key: 'COMMITMENT', val: komitmen },
                { key: 'BEYOND', val: beyond },
                { key: 'CO', val: co },
                { key: 'NR', val: nr }
            ];

            for (const cat of categories) {
                await query(
                    `INSERT INTO revenue_target_yearly (year, sbu_id, kategori, target_amount)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (year, sbu_id, kategori) DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()`,
                    [year, sbuId, cat.key, cat.val]
                );
            }

            // 2. Distribute Monthly
            for (let i = 0; i < 12; i++) {
                const monthData = monthIdsResult[i];
                const cumulativePct = weights[i];
                const prevCumulativePct = i === 0 ? 0 : weights[i - 1];
                const monthlyPct = cumulativePct - prevCumulativePct;

                const mRkap = (rkap * monthlyPct) / 100;
                const mCommitment = (komitmen * monthlyPct) / 100;
                const mBeyond = (beyond * monthlyPct) / 100;
                const mCo = (co * monthlyPct) / 100;
                const mNr = (nr * monthlyPct) / 100;

                const monthlyItems = [
                    { key: 'RKAP', val: mRkap },
                    { key: 'COMMITMENT', val: mCommitment },
                    { key: 'BEYOND', val: mBeyond },
                    { key: 'CO', val: mCo },
                    { key: 'NR', val: mNr }
                ];

                for (const item of monthlyItems) {
                    await query(
                        `INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (time_month_id, sbu_id, kategori) DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()`,
                        [monthData.id, sbuId, item.key, item.val]
                    );
                }
            }
        }

        return NextResponse.json({ success: true, count: rows.length });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Failed to import" }, { status: 500 });
    }
}
