import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
    try {
        console.log("Running migration: Add target_aktivasi column...");

        await query(`
            ALTER TABLE pipeline_potensi 
            ADD COLUMN IF NOT EXISTS target_aktivasi DATE
        `);

        console.log("Column target_aktivasi added successfully");

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
