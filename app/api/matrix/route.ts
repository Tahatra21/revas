import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RPMSEngine } from "@/lib/rpms";

const TARGET_YTD_SCHEDULE: Record<number, number> = {
    1: 0.05,
    2: 0.10,
    3: 0.15,
    4: 0.20,
    5: 0.25,
    6: 0.40,
    7: 0.45,
    8: 0.55,
    9: 0.65,
    10: 0.80,
    11: 0.90,
    12: 1.00
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const targetTypeStr = searchParams.get("targetType") || "RKAP";

    try {
        console.log(`[Matrix API] Fetching for Year: ${year}, Month: ${month}, Type: ${targetTypeStr}`);

        // 1. Fetch Request: Get all Units with their Targets and Actuals for the period
        // Fetch ALL targets for the year (no type filter) to support CO/NR columns
        const units = await prisma.unit.findMany({
            orderBy: { code: 'asc' },
            include: {
                targets: {
                    where: {
                        year
                        // Removed targetType filter here to fetch ALL types (RKAP, BEYOND, CO, NR)
                    }
                },
                actuals: {
                    where: {
                        year,
                        month: { lte: month } // YTD
                    }
                }
            }
        });

        // 2. Process Data: Calculate metrics per unit
        const matrixData = units.map(unit => {
            // Filter targets by selected type for the MAIN calculation logic (e.g. RKAP)
            const relevantTargets = unit.targets.filter(t => t.targetType === targetTypeStr);

            // Data is stored as YTD/Cumulative in the database
            // So we simply take the value for the specified month (Snapshot)

            // Target YTD (Snapshot for current month)
            const targetYTD = relevantTargets
                .find(t => t.month === month)?.amount ? Number(relevantTargets.find(t => t.month === month)?.amount) : 0;

            // Target Full Year (Snapshot for Month 12)
            // Use target for Month 12 of the targetType
            const targetFullYear = relevantTargets
                .find(t => t.month === 12)?.amount ? Number(relevantTargets.find(t => t.month === 12)?.amount) : 0;

            // Actual YTD (Snapshot)
            const actualYTD = unit.actuals
                .find(a => a.month === month)?.amount ? Number(unit.actuals.find(a => a.month === month)?.amount) : 0;

            // CO & NR (Snapshot)
            const coCurrentMonth = unit.targets
                .find(t => t.targetType === 'COMMITMENT' && t.month === month)?.amount ? Number(unit.targets.find(t => t.targetType === 'COMMITMENT' && t.month === month)?.amount) : 0;

            const nrCurrentMonth = unit.targets
                .find(t => t.targetType === 'NR' && t.month === month)?.amount ? Number(unit.targets.find(t => t.targetType === 'NR' && t.month === month)?.amount) : 0;

            const achievementPct = RPMSEngine.calculateAchievement(actualYTD, targetYTD);
            const gap = actualYTD - targetYTD;
            const status = RPMSEngine.determineStatus(achievementPct);

            return {
                id: unit.id,
                name: unit.name,
                code: unit.code,
                level: unit.level,
                parentId: unit.parentId,
                target: targetYTD,
                targetFullYear: targetFullYear,
                coCurrentMonth,
                nrCurrentMonth,
                actual: actualYTD,
                achievementPct,
                gap,
                status
            };
        });

        // Custom Sort Order
        const sortOrder = [
            "KONFRA",
            "APLIKASI",
            "JKB",
            "JBB",
            "JTG",
            "JBT",
            "BNR",
            "SBU",
            "SBT",
            "SBS",
            "SLW",
            "KLM"
        ];

        // Helper to find index, fuzzy match for Konfra/Aplikasi if needed but codes should match from upload
        const getSortIndex = (code: string) => {
            const cleanCode = code.trim();
            const idx = sortOrder.findIndex(k => cleanCode.includes(k) || k.includes(cleanCode));
            return idx === -1 ? 999 : idx;
        };

        matrixData.sort((a, b) => getSortIndex(a.code) - getSortIndex(b.code));

        return NextResponse.json(matrixData);

    } catch (error) {
        console.error("Matrix API Error:", error);
        return NextResponse.json({ error: "Failed to fetch Matrix data" }, { status: 500 });
    }
}
