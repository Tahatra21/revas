import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
    try {
        console.log("Deleting all pipeline data...");

        const result = await query(`DELETE FROM pipeline_potensi`);

        console.log("All pipeline data deleted successfully");

        return NextResponse.json({
            message: "All pipeline data deleted successfully",
            deletedCount: result.length,
            status: "success"
        });
    } catch (error: any) {
        console.error("Delete error:", error);
        return NextResponse.json({
            message: "Delete failed",
            error: error.message
        }, { status: 500 });
    }
}
