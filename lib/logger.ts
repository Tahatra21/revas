
import { prisma } from "@/lib/db";

type ActivityType = "info" | "success" | "warning" | "critical" | "system";

interface LogEntry {
    userId?: number;
    userName: string;
    action: string;
    details?: string;
    type?: ActivityType;
    ipAddress?: string;
}

export async function logActivity({ userId, userName, action, details, type = "info", ipAddress }: LogEntry) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                userName,
                action,
                details,
                type,
                ipAddress,
            },
        });
    } catch (error) {
        console.error("Failed to create activity log:", error);
        // Don't throw, logging failure shouldn't crash the app
    }
}
