import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());

        const rows = await query<{
            target: string | number | null;
            actual: string | number | null;
            pipeline_most_likely: string | number | null;
        }>(
            `
      SELECT 
        COALESCE((
          SELECT SUM(target_amount) FROM revenue_target_yearly WHERE year = $1
        ), 0) AS target,
        COALESCE((
          SELECT SUM(a.amount)
          FROM revenue_actual_monthly a
          JOIN master_time_month t ON t.id = a.time_month_id
          WHERE t.year = $1
        ), 0) AS actual,
        COALESCE((
          SELECT SUM(est_revenue)
          FROM pipeline_potensi
          WHERE warna_status_potensi = 'HIJAU'
        ), 0) AS pipeline_most_likely
      `,
            [year]
        );

        const row = rows[0];

        const target = Number(row.target ?? 0);
        const actual = Number(row.actual ?? 0);
        const pipelineMostLikely = Number(row.pipeline_most_likely ?? 0);

        return NextResponse.json({
            year,
            targetYearly: target,
            realizationYearly: actual,
            pipelineMostLikely,
            achievementPct: target > 0 ? (actual / target) * 100 : 0,
        });
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        return NextResponse.json(
            { message: "Failed to fetch dashboard summary" },
            { status: 500 }
        );
    }
}
