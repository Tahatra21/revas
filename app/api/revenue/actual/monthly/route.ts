import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());
        const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
        const sbuId = searchParams.get("sbu") ? Number(searchParams.get("sbu")) : null;

        let sql = `
      SELECT 
        a.id,
        t.year,
        t.month,
        t.month_name AS "monthName",
        s.code AS "sbuCode",
        s.name AS "sbuName",
        a.type_pendapatan AS "typePendapatan",
        a.amount,
        a.source_reference AS "sourceReference",
        a.notes
      FROM revenue_actual_monthly a
      JOIN master_time_month t ON t.id = a.time_month_id
      LEFT JOIN master_sbu s ON s.id = a.sbu_id
      WHERE t.year = $1
    `;
        const params: any[] = [year];

        if (month) {
            params.push(month);
            sql += ` AND t.month = $${params.length}`;
        }

        if (sbuId) {
            params.push(sbuId);
            sql += ` AND a.sbu_id = $${params.length}`;
        }

        sql += " ORDER BY t.month, s.code, a.type_pendapatan";

        const rows = await query(sql, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching actual revenue:", error);
        return NextResponse.json(
            { message: "Failed to fetch actual revenue" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.year || !body.month || !body.sbuId || !body.typePendapatan || body.amount === undefined) {
            return NextResponse.json(
                { message: "year, month, sbuId, typePendapatan, and amount are required" },
                { status: 400 }
            );
        }

        // Validate type_pendapatan
        if (!["NR", "CO", "LAIN_LAIN"].includes(body.typePendapatan)) {
            return NextResponse.json(
                { message: "typePendapatan must be NR, CO, or LAIN_LAIN" },
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
      INSERT INTO revenue_actual_monthly 
        (time_month_id, sbu_id, type_pendapatan, amount, source_reference, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (time_month_id, sbu_id, type_pendapatan)
      DO UPDATE SET amount = EXCLUDED.amount,
                    source_reference = EXCLUDED.source_reference,
                    notes = EXCLUDED.notes,
                    updated_at = NOW()
      RETURNING id, time_month_id AS "timeMonthId", sbu_id AS "sbuId", 
                type_pendapatan AS "typePendapatan", amount, 
                source_reference AS "sourceReference", notes
    `;
        const params = [
            timeMonthId,
            body.sbuId,
            body.typePendapatan,
            body.amount,
            body.sourceReference ?? null,
            body.notes ?? null,
        ];

        const rows = await query(sql, params);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating/updating actual revenue:", error);
        return NextResponse.json(
            { message: "Failed to create/update actual revenue" },
            { status: 500 }
        );
    }
}
