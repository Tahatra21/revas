
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { action: { contains: search, mode: "insensitive" } },
                { userName: { contains: search, mode: "insensitive" } },
                { details: { contains: search, mode: "insensitive" } },
            ];
        }

        if (type && type !== "all") {
            where.type = type;
        }

        const logs = await prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        // Format dates for frontend
        const formattedLogs = logs.map(log => ({
            ...log,
            time: new Date(log.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            }),
            // Use time-ago formatting if preferred, but explicit date is safer for API
        }));

        return NextResponse.json(formattedLogs);
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
