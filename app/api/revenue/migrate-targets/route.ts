import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
    try {
        console.log("Running migration: Add target fields...");

        // Add new columns
        await query(`
            ALTER TABLE revenue_target_yearly 
            ADD COLUMN IF NOT EXISTS target_rkap BIGINT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS co_tahun_berjalan BIGINT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS target_nr BIGINT DEFAULT 0
        `);

        console.log("Columns added successfully");

        // Drop old constraint
        await query(`
            ALTER TABLE revenue_target_yearly 
            DROP CONSTRAINT IF EXISTS revenue_target_yearly_year_sbu_id_kategori_key
        `);

        console.log("Old constraint dropped");

        // Add new constraint
        await query(`
            ALTER TABLE revenue_target_yearly 
            DROP CONSTRAINT IF EXISTS revenue_target_yearly_year_sbu_id_key
        `);

        await query(`
            ALTER TABLE revenue_target_yearly 
            ADD CONSTRAINT revenue_target_yearly_year_sbu_id_key UNIQUE(year, sbu_id)
        `);

        console.log("New constraint added");

        return NextResponse.json({
            message: "Migration completed successfully",
            status: "success"
        });
    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({
            message: "Migration failed",
            error: error.message
        }, { status: 500 });
    }
}
