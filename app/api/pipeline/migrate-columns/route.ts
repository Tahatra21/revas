import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
    try {
        console.log("Running migration: Add pipeline extra columns...");

        await query(`
            ALTER TABLE pipeline_potensi 
            ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1
        `);

        await query(`
            ALTER TABLE pipeline_potensi 
            ADD COLUMN IF NOT EXISTS category_2026 VARCHAR(100)
        `);

        await query(`
            ALTER TABLE pipeline_potensi 
            ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100)
        `);

        console.log("Columns added successfully");

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
