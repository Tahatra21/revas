import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
    try {
        console.log("Running migration: Change pipeline columns to NUMERIC...");

        await query(`
            ALTER TABLE pipeline_potensi 
            ALTER COLUMN nilai_otc TYPE NUMERIC(20, 4),
            ALTER COLUMN nilai_mrc TYPE NUMERIC(20, 4),
            ALTER COLUMN est_revenue TYPE NUMERIC(20, 4),
            ALTER COLUMN mapping_revenue TYPE NUMERIC(20, 4)
        `);

        console.log("Columns converted to NUMERIC successfully");

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
