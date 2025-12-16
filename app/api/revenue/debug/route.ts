import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        // Check import records
        const imports = await query(`
            SELECT id, period_month, period_year, status, error_message, uploaded_at 
            FROM revenue_imports 
            WHERE period_year = 2025 AND period_month = 11 
            ORDER BY uploaded_at DESC
            LIMIT 5
        `);

        let summaryCount = 0;
        let summaryRows = [];

        if (imports.length > 0) {
            const summary = await query(`
                SELECT COUNT(*) as count
                FROM revenue_summary_pln 
                WHERE import_id = $1
            `, [imports[0].id]);

            summaryCount = summary[0]?.count || 0;

            // Get sample rows
            summaryRows = await query(`
                SELECT kode_bidang, realisasi_billion, row_data
                FROM revenue_summary_pln 
                WHERE import_id = $1
                LIMIT 3
            `, [imports[0].id]);
        }

        return NextResponse.json({
            imports,
            summaryCount,
            summaryRows
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
