import { NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return NextResponse.json(
                { message: "No token provided" },
                { status: 401 }
            );
        }

        const payload = verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { message: "Invalid or expired token" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: payload.userId,
                username: payload.username,
                email: payload.email,
                role: payload.role,
                sbuId: payload.sbuId,
            },
        });
    } catch (error) {
        console.error("Verify token error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
