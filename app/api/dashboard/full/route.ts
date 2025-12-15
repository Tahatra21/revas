import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());

        // Get summary
        const [summary] = await query(
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
        ), 0) AS actual
      `,
            [year]
        );

        // Get pipeline by color
        const pipelineColors = await query(
            `
      SELECT warna_status_potensi AS color,
             SUM(est_revenue) AS value
      FROM pipeline_potensi
      WHERE EXTRACT(YEAR FROM periode_snapshot) = $1
      GROUP BY warna_status_potensi
      `,
            [year]
        );

        // Get top customers
        const topCustomers = await query(
            `
      SELECT c.name AS "customerName",
             SUM(p.est_revenue) AS "totalEstRevenue"
      FROM pipeline_potensi p
      JOIN master_customer c ON c.id = p.customer_id
      WHERE EXTRACT(YEAR FROM p.periode_snapshot) = $1
      GROUP BY c.name
      ORDER BY SUM(p.est_revenue) DESC
      LIMIT 5
      `,
            [year]
        );

        // Get monthly revenue
        const monthly = await query(
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
            targetYearly: Number(summary.target ?? 0),
            realizationYearly: Number(summary.actual ?? 0),
            pipelineByColor: pipelineColors.map((r: any) => ({
                color: r.color,
                value: Number(r.value ?? 0),
            })),
            topCustomers: topCustomers.map((r: any) => ({
                customerName: r.customerName,
                totalEstRevenue: Number(r.totalEstRevenue ?? 0),
            })),
            monthly: monthly.map((r: any) => ({
                month: r.month,
                nr: Number(r.nr ?? 0),
                co: Number(r.co ?? 0),
            })),
        });
    } catch (error) {
        console.error("Error fetching dashboard full:", error);
        return NextResponse.json(
            { message: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
