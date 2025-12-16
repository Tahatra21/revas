import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// DELETE endpoint to clear all SBU data
export async function DELETE() {
    try {
        // Delete related records first to avoid foreign key constraint violations
        console.log("Deleting related pipeline records...");
        await query("DELETE FROM pipeline_potensi");

        console.log("Deleting revenue target records...");
        await query("DELETE FROM revenue_target_yearly");
        await query("DELETE FROM revenue_target_monthly");

        console.log("Deleting revenue actual records...");
        await query("DELETE FROM revenue_actual");

        console.log("Deleting all SBU records...");
        const result = await query("DELETE FROM master_sbu");

        // Reset auto-increment sequence
        console.log("Resetting ID sequence...");
        await query("ALTER SEQUENCE master_sbu_id_seq RESTART WITH 1");

        return NextResponse.json({
            message: "All SBU data and related records deleted successfully",
            status: "success",
            deletedRecords: result.rowCount
        });
    } catch (error: any) {
        console.error("Error deleting all SBUs:", error);
        return NextResponse.json(
            { message: "Failed to delete SBU data", error: error.message },
            { status: 500 }
        );
    }
}
