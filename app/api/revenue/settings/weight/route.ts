import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    try {
        const result = await query(
            `SELECT * FROM master_revenue_weight WHERE year = $1`,
            [year]
        );

        if (result.length === 0) {
            // Return default structure if no record found
            return NextResponse.json({
                year,
                jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
                jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 100
            });
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("Error fetching weights:", error);
        return NextResponse.json({ error: "Failed to fetch weights" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { year, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec } = body;

        // Validation: Dec must be 100
        if (Number(dec) !== 100) {
            return NextResponse.json({ error: "December weight must be 100%" }, { status: 400 });
        }

        const sql = `
            INSERT INTO master_revenue_weight (
                year, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            ON CONFLICT (year) DO UPDATE SET
                jan = EXCLUDED.jan,
                feb = EXCLUDED.feb,
                mar = EXCLUDED.mar,
                apr = EXCLUDED.apr,
                may = EXCLUDED.may,
                jun = EXCLUDED.jun,
                jul = EXCLUDED.jul,
                aug = EXCLUDED.aug,
                sep = EXCLUDED.sep,
                oct = EXCLUDED.oct,
                nov = EXCLUDED.nov,
                dec = EXCLUDED.dec,
                updated_at = NOW()
            RETURNING *
        `;

        const values = [year, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec];
        const result = await query(sql, values);

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("Error saving weights:", error);
        return NextResponse.json({ error: "Failed to save weights" }, { status: 500 });
    }
}
