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
        COALESCE(r.target_komitmen, 0) AS "targetKomitmen",
        COALESCE(r.target_beyond_rkap, 0) AS "targetBeyondRkap",
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
        console.log("Target POST request body:", body);

        if (!body.year || !body.sbuId) {
            return NextResponse.json(
                { message: "year and sbuId are required" },
                { status: 400 }
            );
        }

        // Extract values with defaults
        const targetRkap = body.targetRkap || 0;
        const targetKomitmen = body.targetKomitmen || 0;
        const targetBeyondRkap = body.targetBeyondRkap || 0;
        const coTahunBerjalan = body.coTahunBerjalan || 0;
        const targetNr = body.targetNr || 0;

        const sql = `
      INSERT INTO revenue_target_yearly (
        year, sbu_id, kategori, target_amount, 
        target_rkap, target_komitmen, target_beyond_rkap, 
        co_tahun_berjalan, target_nr
      )
      VALUES ($1, $2, 'TOTAL', 0, $3, $4, $5, $6, $7)
      ON CONFLICT (year, sbu_id)
      DO UPDATE SET 
        target_rkap = EXCLUDED.target_rkap,
        target_komitmen = EXCLUDED.target_komitmen,
        target_beyond_rkap = EXCLUDED.target_beyond_rkap,
        co_tahun_berjalan = EXCLUDED.co_tahun_berjalan,
        target_nr = EXCLUDED.target_nr,
        updated_at = NOW()
      RETURNING id, year, sbu_id, 
                target_rkap AS "targetRkap",
                target_komitmen AS "targetKomitmen",
                target_beyond_rkap AS "targetBeyondRkap",
                co_tahun_berjalan AS "coTahunBerjalan",
                target_nr AS "targetNr"
    `;
        const params = [body.year, body.sbuId, targetRkap, targetKomitmen, targetBeyondRkap, coTahunBerjalan, targetNr];

        console.log("Executing SQL with params:", params);

        const rows = await query(sql, params);
        console.log("Query result:", rows[0]);

        // --- AUTOMATIC MONTHLY DISTRIBUTION ---
        // Distribute        // Fetch Monthly Weights for this year
        const weightResult = await query(
            `SELECT * FROM master_revenue_weight WHERE year = $1`,
            [body.year]
        );

        let weights = [5, 10, 15, 20, 25, 40, 45, 55, 65, 80, 90, 100]; // Default Fallback
        if (weightResult.length > 0) {
            const w = weightResult[0];
            weights = [
                Number(w.jan), Number(w.feb), Number(w.mar), Number(w.apr),
                Number(w.may), Number(w.jun), Number(w.jul), Number(w.aug),
                Number(w.sep), Number(w.oct), Number(w.nov), Number(w.dec)
            ];
        }

        // Generate monthly targets based on weights
        const monthIdsResult = await query(
            `SELECT id, month FROM master_time_month WHERE year = $1 ORDER BY month`,
            [body.year]
        );

        if (monthIdsResult.length !== 12) {
            throw new Error(`Master time data for year ${body.year} is incomplete (found ${monthIdsResult.length} months)`);
        }

        for (let i = 0; i < 12; i++) {
            const monthData = monthIdsResult[i];
            const cumulativePct = weights[i];
            const prevCumulativePct = i === 0 ? 0 : weights[i - 1];
            const monthlyPct = cumulativePct - prevCumulativePct;

            // Calculate Monthly Portions
            const monthlyRkap = Math.round((Number(body.targetRkap) * monthlyPct) / 100);
            const monthlyBeyond = Math.round((Number(body.targetBeyondRkap || 0) * monthlyPct) / 100);
            const monthlyNr = Math.round((Number(body.targetNr || 0) * monthlyPct) / 100);
            const monthlyCo = Math.round((Number(body.coTahunBerjalan || 0) * monthlyPct) / 100);

            // Upsert RKAP
            await query(`
                INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
                VALUES ($1, $2, 'RKAP', $3)
                ON CONFLICT (time_month_id, sbu_id, kategori) 
                DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()
            `, [monthData.id, body.sbuId, monthlyRkap]);

            // Upsert Beyond
            if (body.targetBeyondRkap) {
                await query(`
                    INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
                    VALUES ($1, $2, 'BEYOND', $3)
                    ON CONFLICT (time_month_id, sbu_id, kategori) 
                    DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()
                `, [monthData.id, body.sbuId, monthlyBeyond]);
            }
        }
        // --------------------------------------

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating/updating yearly target:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint
        });
        return NextResponse.json(
            { message: "Failed to create/update yearly target", error: error.message },
            { status: 500 }
        );
    }
}
