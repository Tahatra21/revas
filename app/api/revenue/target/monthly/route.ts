import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());
        const sbuId = searchParams.get("sbu") ? Number(searchParams.get("sbu")) : null;

        let sql = `
      SELECT 
        r.id,
        t.year,
        t.month,
        t.month_name AS "monthName",
        s.code AS "sbuCode",
        s.name AS "sbuName",
        r.kategori,
        r.target_amount AS "targetAmount"
      FROM revenue_target_monthly r
      JOIN master_time_month t ON r.time_month_id = t.id
      LEFT JOIN master_sbu s ON r.sbu_id = s.id
      WHERE t.year = $1
    `;
        const params: any[] = [year];

        if (sbuId) {
            params.push(sbuId);
            sql += ` AND r.sbu_id = $${params.length}`;
        }

        sql += " ORDER BY t.month, s.code, r.kategori";

        const rows = await query(sql, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching monthly targets:", error);
        return NextResponse.json(
            { message: "Failed to fetch monthly targets" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.year || !body.month || !body.sbuId || !body.kategori || body.targetAmount === undefined) {
            return NextResponse.json(
                { message: "year, month, sbuId, kategori, and targetAmount are required" },
                { status: 400 }
            );
        }

        // Find time_month_id
        const timeMonthRows = await query(
            "SELECT id FROM master_time_month WHERE year = $1 AND month = $2",
            [body.year, body.month]
        );

        if (timeMonthRows.length === 0) {
            return NextResponse.json(
                { message: "Invalid year/month combination" },
                { status: 400 }
            );
        }

        const timeMonthId = timeMonthRows[0].id;

        const sql = `
      INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (time_month_id, sbu_id, kategori)
      DO UPDATE SET target_amount = EXCLUDED.target_amount,
                    updated_at = NOW()
      RETURNING id, time_month_id AS "timeMonthId", sbu_id AS "sbuId", kategori, target_amount AS "targetAmount"
    `;
        const params = [timeMonthId, body.sbuId, body.kategori, body.targetAmount];

        const rows = await query(sql, params);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating/updating monthly target:", error);
        return NextResponse.json(
            { message: "Failed to create/update monthly target" },
            { status: 500 }
        );
    }
}
