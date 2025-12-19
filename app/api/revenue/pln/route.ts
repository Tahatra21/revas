import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    try {
        // 1. Find the latest successful import for this period
        const importRecord = await prisma.revenue_imports.findFirst({
            where: {
                period_year: year,
                period_month: month,
                status: 'SUCCESS'
            },
            orderBy: {
                uploaded_at: 'desc'
            },
            select: {
                id: true,
                uploaded_at: true,
                table_headers: true
            }
        });

        if (!importRecord) {
            return NextResponse.json({ data: [], lastUpdated: null });
        }

        const importId = importRecord.id;
        const lastUpdated = importRecord.uploaded_at;
        const headers = importRecord.table_headers || [];

        // 2. Fetch summary data for this import
        const rows = await prisma.revenue_summary_pln.findMany({
            where: {
                import_id: importId
            },
            orderBy: {
                id: 'asc'
            },
            select: {
                row_data: true
            }
        });

        // Extract items from row_data
        const cleanRows = rows
            .map((r) => r.row_data)
            .filter((r) => r !== null && typeof r === 'object');

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

export async function DELETE(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || "0");
    const month = parseInt(searchParams.get("month") || "0");

    if (!year || !month || month < 1 || month > 12) {
        return NextResponse.json(
            { message: "Invalid year or month parameter" },
            { status: 400 }
        );
    }

    try {
        // Delete the import records themselves
        // Assuming database FKs are set to CASCADE as per schema.
        // If not, this might fail, but checking schema allows onDelete: Cascade.
        const result = await prisma.revenue_imports.deleteMany({
            where: {
                period_year: year,
                period_month: month
            }
        });

        return NextResponse.json({
            message: "Data deleted successfully",
            count: result.count,
            year,
            month
        });

    } catch (error: any) {
        console.error("Error deleting revenue PLN data:", error);
        return NextResponse.json(
            { message: "Failed to delete data", error: error.message },
            { status: 500 }
        );
    }
}
