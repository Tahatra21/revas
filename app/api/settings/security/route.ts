
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/logger";

// Default settings
const DEFAULTS = {
    password_expiry: "true",
    session_timeout: "30",
    two_factor_enabled: "false",
    ip_detection: "true"
};

export async function GET(req: NextRequest) {
    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap: any = { ...DEFAULTS };

        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json(settingsMap);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Simple authentication check placeholder - in real app check session
        // Assuming headers contain username for logging context
        const username = req.headers.get("x-user") || "Admin";

        const body = await req.json();

        // Upsert keys
        const updates = [];
        for (const [key, value] of Object.entries(body)) {
            updates.push(
                prisma.systemSetting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) }
                })
            );
        }

        await prisma.$transaction(updates);

        // Log it
        await logActivity({
            userName: username,
            action: "Update Security Policy",
            details: `Updated settings: ${Object.keys(body).join(", ")}`,
            type: "critical"
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
