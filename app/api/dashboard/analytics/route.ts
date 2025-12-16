import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());

        // 1. Executive Summary & Weighted Revenue
        // Formula: Hijau (90%) + Kuning (50%) + Merah (10%)
        const summary = await query(
            `
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
                WHERE EXTRACT(YEAR FROM periode_snapshot) = $1
            )
            SELECT 
                weighted_revenue,
                total_pipeline_value,
                total_deals,
                ROUND((hijau_count::numeric / NULLIF(total_deals, 0)::numeric) * 100, 1) as win_rate_potential
            FROM weighted_calc
            `,
            [year]
        );

        // 2. Top Segments
        const topSegments = await query(
            `
            SELECT 
                COALESCE(segment_industri, 'Uncategorized') as name, 
                SUM(est_revenue) as value
            FROM pipeline_potensi
            WHERE EXTRACT(YEAR FROM periode_snapshot) = $1
            GROUP BY segment_industri
            ORDER BY value DESC
            LIMIT 5
            `,
            [year]
        );

        // 3. Top Products/Services
        const topProducts = await query(
            `
            SELECT 
                COALESCE(nama_layanan, 'Unknown') as name, 
                SUM(est_revenue) as value
            FROM pipeline_potensi
            WHERE EXTRACT(YEAR FROM periode_snapshot) = $1
            GROUP BY nama_layanan
            ORDER BY value DESC
            LIMIT 5
            `,
            [year]
        );

        // 4. SBU Leaderboard
        const sbuLeaderboard = await query(
            `
            SELECT 
                s.code as "sbuCode",
                s.name as "sbuName",
                COALESCE(SUM(p.est_revenue), 0) as "totalPipeline",
                COUNT(p.id) as "dealCount"
            FROM master_sbu s
            LEFT JOIN pipeline_potensi p ON s.id = p.sbu_id AND EXTRACT(YEAR FROM p.periode_snapshot) = $1
            GROUP BY s.id, s.code, s.name
            ORDER BY "totalPipeline" DESC
            LIMIT 10
            `,
            [year]
        );

        // 5. Existing: Pipeline by Status (for Donut Chart)
        const pipelineByStatus = await query(
            `
            SELECT warna_status_potensi as name, SUM(est_revenue) as value
            FROM pipeline_potensi
            WHERE EXTRACT(YEAR FROM periode_snapshot) = $1
            GROUP BY warna_status_potensi
            `,
            [year]
        );

        // 6. Existing: Monthly Revenue (Line Chart)
        const monthlyRevenue = await query(
            `
            SELECT 
                t.month,
                SUM(CASE WHEN a.type_pendapatan = 'NR' THEN a.amount ELSE 0 END) AS "nr",
                SUM(CASE WHEN a.type_pendapatan = 'CO' THEN a.amount ELSE 0 END) AS "co"
            FROM revenue_actual_monthly a
            JOIN master_time_month t ON t.id = a.time_month_id
            WHERE t.year = $1
            GROUP BY t.month
            ORDER BY t.month
            `,
            [year]
        );

        return NextResponse.json({
            year,
            summary: {
                weightedRevenue: Number(summary[0]?.weighted_revenue || 0),
                totalPipelineValue: Number(summary[0]?.total_pipeline_value || 0),
                totalDeals: Number(summary[0]?.total_deals || 0),
                winRatePotential: Number(summary[0]?.win_rate_potential || 0)
            },
            charts: {
                topSegments: topSegments.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                topProducts: topProducts.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                pipelineByStatus: pipelineByStatus.map(r => ({ name: r.name, value: Number(r.value || 0) })),
                monthlyRevenue: monthlyRevenue.map(r => ({ month: r.month, nr: Number(r.nr || 0), co: Number(r.co || 0) }))
            },
            leaderboard: {
                sbu: sbuLeaderboard.map(r => ({
                    code: r.sbuCode,
                    name: r.sbuName,
                    value: Number(r.totalPipeline || 0),
                    deals: Number(r.dealCount || 0)
                }))
            }
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({ message: "Failed to fetch analytics" }, { status: 500 });
    }
}
