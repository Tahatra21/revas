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
        r.target_amount AS "targetAmount",
        COALESCE(r.target_rkap, 0) AS "targetRkap",
        COALESCE(r.co_tahun_berjalan, 0) AS "coTahunBerjalan",
        COALESCE(r.target_nr, 0) AS "targetNr"
      FROM revenue_target_yearly r
      LEFT JOIN master_sbu s ON r.sbu_id = s.id
      WHERE r.year = $1
    `;
        const params: any[] = [year];

        if (sbuId) {
            params.push(sbuId);
            sql += ` AND r.sbu_id = $${params.length}`;
        }

        sql += " ORDER BY s.code";

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

        if (!body.year || !body.sbuId) {
            return NextResponse.json(
                { message: "year and sbuId are required" },
                { status: 400 }
            );
        }

        // Extract values with defaults
        const targetRkap = body.targetRkap || 0;
        const coTahunBerjalan = body.coTahunBerjalan || 0;
        const targetNr = body.targetNr || 0;

        const sql = `
      INSERT INTO revenue_target_yearly (
        year, sbu_id, kategori, target_amount, 
        target_rkap, co_tahun_berjalan, target_nr
      )
      VALUES ($1, $2, 'TOTAL', 0, $3, $4, $5)
      ON CONFLICT (year, sbu_id)
      DO UPDATE SET 
        target_rkap = EXCLUDED.target_rkap,
        co_tahun_berjalan = EXCLUDED.co_tahun_berjalan,
        target_nr = EXCLUDED.target_nr,
        updated_at = NOW()
      RETURNING id, year, sbu_id, 
                target_rkap AS "targetRkap",
                co_tahun_berjalan AS "coTahunBerjalan",
                target_nr AS "targetNr"
    `;
        const params = [body.year, body.sbuId, targetRkap, coTahunBerjalan, targetNr];

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
