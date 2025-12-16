import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
    try {
        // Update PENDING imports to SUCCESS if they have data
        const result = await query(`
            UPDATE revenue_imports 
            SET status = 'SUCCESS' 
            WHERE status = 'PENDING' 
            AND id IN (
                SELECT DISTINCT import_id 
                FROM revenue_summary_pln
            )
            RETURNING id, period_month, period_year
        `);

        return NextResponse.json({
            message: "Status updated",
            updated: result
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
