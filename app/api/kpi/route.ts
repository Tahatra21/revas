import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RPMSEngine } from "@/lib/rpms";

// Use global prisma from lib/db


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const unitId = searchParams.get("unitId") ? Number(searchParams.get("unitId")) : undefined;
    const targetTypeStr = searchParams.get("targetType") || "RKAP";

    try {
        // 1. Fetch Aggregated Actuals (YTD)
        // Sum actuals where year = year AND month <= selectedMonth AND unit matches
        const actualFilter: any = {
            year,
            month: { lte: month }
        };
        if (unitId) actualFilter.unitId = unitId;

        const actualAgg = await prisma.actual.aggregate({
            _sum: { amount: true },
            where: actualFilter
        });
        const actualYTD = Number(actualAgg._sum.amount || 0);

        // 2. Fetch Aggregated Target (YTD)
        const targetFilter: any = {
            year,
            month: { lte: month },
            targetType: targetTypeStr as any
        };
        if (unitId) targetFilter.unitId = unitId;

        const targetAgg = await prisma.target.aggregate({
            _sum: { amount: true },
            where: targetFilter
        });
        const targetYTD = Number(targetAgg._sum.amount || 0);

        // 3. Calculate Metrics
        const achievementPct = RPMSEngine.calculateAchievement(actualYTD, targetYTD);
        const gap = actualYTD - targetYTD;
        const status = RPMSEngine.determineStatus(achievementPct);

        // 4. Forecast (Simple placeholder using same data for now)
        // Fetch all monthly actuals for this filter to run forecast
        const monthlyActuals = await prisma.actual.findMany({
            where: { ...actualFilter, month: { lte: month } },
            orderBy: { month: 'asc' }
        });
        // Aggregate by month (if multiple units selected)
        const monthlySums: Record<number, number> = {};
        monthlyActuals.forEach(a => {
            monthlySums[a.month] = (monthlySums[a.month] || 0) + Number(a.amount);
        });
        const pastMonthsData = Object.values(monthlySums);

        const remainingMonths = 12 - month;
        const forecastAmount = RPMSEngine.forecast(actualYTD, pastMonthsData, remainingMonths);

        return NextResponse.json({
            actualYTD,
            targetYTD,
            achievementPct,
            gap,
            status,
            forecastAmount
        });

    } catch (error) {
        console.error("KPI Error:", error);
        return NextResponse.json({ error: "Failed to fetch KPI" }, { status: 500 });
    }
}
