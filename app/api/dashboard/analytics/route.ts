import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TargetType } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());

        console.log(`[Analytics API] Fetching for Year: ${year}`);

        // Define a helper to sum amounts from targets
        const getSum = async (type: TargetType) => {
            const result = await prisma.target.aggregate({
                _sum: { amount: true },
                where: { year, targetType: type }
            });
            return Number(result._sum.amount || 0);
        };

        // 0. Revenue Targets (Aggregated from Unit -> Targets)
        const targetRkap = await getSum(TargetType.RKAP);
        const targetCommitment = await getSum(TargetType.COMMITMENT);
        const targetBeyondRkap = await getSum(TargetType.BEYOND_RKAP);
        const targetNr = await getSum(TargetType.NR);

        // 0.5 Realization Total YTD
        const actualTotalResult = await prisma.actual.aggregate({
            _sum: { amount: true },
            where: { year }
        });
        const actualTotalYTD = Number(actualTotalResult._sum.amount || 0);


        // 1. Executive Summary (Pipeline data remains from legacy tables for now as it's separate module)
        // Pipeline: 'pipeline_potensi'
        // We will keep the existing pipeline logic but merge with new Revenue numbers
        const pipelineSummaryRaw = await prisma.$queryRaw<any[]>`
            WITH weighted_calc AS (
                SELECT 
                    SUM(CASE WHEN warna_status_potensi = 'HIJAU' THEN est_revenue * 0.9
                             WHEN warna_status_potensi = 'KUNING' THEN est_revenue * 0.5
                             WHEN warna_status_potensi = 'MERAH' THEN est_revenue * 0.1
                             ELSE 0 END) as weighted_revenue,
                    SUM(est_revenue) as total_pipeline_value,
                    COUNT(*) as total_deals,
                    SUM(CASE WHEN warna_status_potensi = 'HIJAU' THEN 1 ELSE 0 END) as hijau_count
                FROM pipeline_potensi
                WHERE EXTRACT(YEAR FROM periode_snapshot) = ${year}
            )
            SELECT 
                weighted_revenue,
                total_pipeline_value,
                total_deals,
                ROUND((hijau_count::numeric / NULLIF(total_deals, 0)::numeric) * 100, 1) as win_rate_potential
            FROM weighted_calc
        `;
        const pipeSum = pipelineSummaryRaw[0] || {};


        // 6. Monthly Revenue Trend (From RPMS Tables)
        // We need 1-12 months for RKAP, Beyond, CO, NR, Actual
        const monthlyData = [];
        for (let m = 1; m <= 12; m++) {
            const getMonthSum = async (model: 'target' | 'actual', type?: TargetType) => {
                if (model === 'actual') {
                    const r = await prisma.actual.aggregate({
                        _sum: { amount: true },
                        where: { year, month: m }
                    });
                    return Number(r._sum.amount || 0);
                } else {
                    const r = await prisma.target.aggregate({
                        _sum: { amount: true },
                        where: { year, month: m, targetType: type }
                    });
                    return Number(r._sum.amount || 0);
                }
            };

            const [rkap, beyond, co, nr, actual] = await Promise.all([
                getMonthSum('target', TargetType.RKAP),
                getMonthSum('target', TargetType.BEYOND_RKAP),
                getMonthSum('target', TargetType.COMMITMENT),
                getMonthSum('target', TargetType.NR),
                getMonthSum('actual')
            ]);

            monthlyData.push({
                month: m,
                rkap,
                beyond,
                co,
                nr,
                target: rkap, // Legacy prop name for chart
                targetBeyond: beyond, // Legacy prop name for chart
                realization: actual
            });
        }


        // 4. SBU Leaderboard (From RPMS `Unit` table now)
        // Aggregated by Unit (which represents SBU)
        // Sort by Total Pipeline (from legacy) OR by Achievement?
        // User asked for "insight yang ada di database" -> usually Achievement
        // But dashboard needs Pipeline Leaderboard too.
        // Let's deliver BOTH or Mixed.
        // The existing frontend expects "totalPipeline" and "dealCount".
        // We will keep fetching Pipeline Leaderboard from `pipeline_potensi` but map SBU code correctly
        const sbuLeaderboardRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                s.code as "sbuCode",
                s.name as "sbuName",
                COALESCE(SUM(p.est_revenue), 0) as "totalPipeline",
                COUNT(p.id) as "dealCount"
            FROM master_sbu s
            LEFT JOIN pipeline_potensi p ON s.id = p.sbu_id AND EXTRACT(YEAR FROM p.periode_snapshot) = ${year}
            GROUP BY s.id, s.code, s.name
            ORDER BY "totalPipeline" DESC
            LIMIT 10
        `;


        // 7 & 8 Pipeline composition charts (Same as legacy)
        const topSegments = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(segment_industri, 'Uncategorized') as name, 
                SUM(est_revenue) as value
            FROM pipeline_potensi
            WHERE EXTRACT(YEAR FROM periode_snapshot) = ${year}
            GROUP BY segment_industri
            ORDER BY value DESC
            LIMIT 5
        `;

        const topProducts = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(nama_layanan, 'Unknown') as name, 
                SUM(est_revenue) as value
            FROM pipeline_potensi
            WHERE EXTRACT(YEAR FROM periode_snapshot) = ${year}
            GROUP BY nama_layanan
            ORDER BY value DESC
            LIMIT 5
        `;

        const pipelineByStatus = await prisma.$queryRaw<any[]>`
             SELECT warna_status_potensi as name, SUM(est_revenue) as value
             FROM pipeline_potensi
             WHERE EXTRACT(YEAR FROM periode_snapshot) = ${year}
             GROUP BY warna_status_potensi
        `;

        const pipelineBySegment = await prisma.$queryRaw<any[]>`
            SELECT COALESCE(segment_industri, 'Uncategorized') as name, SUM(est_revenue) as value
            FROM pipeline_potensi
            WHERE EXTRACT(YEAR FROM periode_snapshot) = ${year}
            GROUP BY segment_industri
            ORDER BY value DESC
            LIMIT 6
        `;

        const pipelineByGroup = await prisma.$queryRaw<any[]>`
             SELECT 
                COALESCE(sg.name, 'Non-Group') as name, 
                SUM(p.est_revenue) as value
            FROM pipeline_potensi p
            LEFT JOIN master_customer c ON p.customer_id = c.id
            LEFT JOIN master_segment_pln_group sg ON c.pln_group_segment_id = sg.id
            WHERE EXTRACT(YEAR FROM p.periode_snapshot) = ${year}
            GROUP BY sg.name
            ORDER BY value DESC
            LIMIT 6
         `;


        return NextResponse.json({
            year,
            summary: {
                // Pipeline Metrics
                weightedRevenue: Number(pipeSum.weighted_revenue || 0),
                totalPipelineValue: Number(pipeSum.total_pipeline_value || 0),
                totalDeals: Number(pipeSum.total_deals || 0),
                winRatePotential: Number(pipeSum.win_rate_potential || 0),

                // Revenue Metrics (From RPMS)
                targetRkap,
                targetKomitmen: targetCommitment,
                targetBeyondRkap,
                targetNr, // NEW
                actualTotalYTD // NEW
            },
            charts: {
                topSegments: topSegments.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                topProducts: topProducts.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                pipelineByStatus: pipelineByStatus.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                pipelineBySegment: pipelineBySegment.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                pipelineByGroup: pipelineByGroup.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                monthlyRevenue: monthlyData
            },
            leaderboard: {
                sbu: sbuLeaderboardRaw.map(r => ({
                    code: r.sbuCode,
                    name: r.sbuName,
                    value: Number(r.totalPipeline || 0),
                    deals: Number(r.dealCount || 0)
                }))
            }
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({
            message: "Failed to fetch analytics",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
