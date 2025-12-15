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
        r.year,
        s.code AS "sbuCode",
        s.name AS "sbuName",
        r.kategori,
        r.target_amount AS "targetAmount"
      FROM revenue_target_yearly r
      LEFT JOIN master_sbu s ON r.sbu_id = s.id
      WHERE r.year = $1
    `;
        const params: any[] = [year];

        if (sbuId) {
            params.push(sbuId);
            sql += ` AND r.sbu_id = $${params.length}`;
        }

        sql += " ORDER BY s.code, r.kategori";

        const rows = await query(sql, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching yearly targets:", error);
        return NextResponse.json(
            { message: "Failed to fetch yearly targets" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.year || !body.sbuId || !body.kategori || body.targetAmount === undefined) {
            return NextResponse.json(
                { message: "year, sbuId, kategori, and targetAmount are required" },
                { status: 400 }
            );
        }

        const sql = `
      INSERT INTO revenue_target_yearly (year, sbu_id, kategori, target_amount)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (year, sbu_id, kategori)
      DO UPDATE SET target_amount = EXCLUDED.target_amount,
                    updated_at = NOW()
      RETURNING id, year, sbu_id, kategori, target_amount AS "targetAmount"
    `;
        const params = [body.year, body.sbuId, body.kategori, body.targetAmount];

        const rows = await query(sql, params);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating/updating yearly target:", error);
        return NextResponse.json(
            { message: "Failed to create/update yearly target" },
            { status: 500 }
        );
    }
}
