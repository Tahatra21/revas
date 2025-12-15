import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    try {
        // 1. Find the latest successful import for this period
        const imports = await query<{ id: string; uploaded_at: Date; table_headers: any }>(
            `SELECT id, uploaded_at, table_headers 
       FROM revenue_imports 
       WHERE period_year = $1 AND period_month = $2 AND status = 'SUCCESS'
       ORDER BY uploaded_at DESC 
       LIMIT 1`,
            [year, month]
        );

        if (imports.length === 0) {
            return NextResponse.json({ data: [], lastUpdated: null });
        }

        const importId = imports[0].id;
        const lastUpdated = imports[0].uploaded_at;
        const headers = imports[0].table_headers || [];

        // 2. Fetch summary data for this import
        const rows = await query(
            `SELECT row_data
       FROM revenue_summary_pln
       WHERE import_id = $1
       ORDER BY id ASC`,
            [importId]
        );

        // Extract items from row_data
        const cleanRows = rows.map((r: any) => r.row_data);

        return NextResponse.json({
            headers: headers,
            data: cleanRows,
            lastUpdated: lastUpdated
        });

    } catch (error: any) {
        console.error("Error fetching revenue PLN data:", error);
        return NextResponse.json(
            { message: "Failed to fetch data", error: error.message },
            { status: 500 }
        );
    }
}
