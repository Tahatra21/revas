import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        userId: number;
        username: string;
        email: string;
        role: string;
        sbuId?: number;
    };
}

/**
 * Middleware to protect API routes
 * Usage: const user = await requireAuth(req);
 */
export async function requireAuth(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        throw new Error("No token provided");
    }

    const payload = verifyToken(token);

    if (!payload) {
        throw new Error("Invalid or expired token");
    }

    return {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        sbuId: payload.sbuId,
    };
}

/**
 * Middleware to check if user has required role
 */
export async function requireRole(req: NextRequest, allowedRoles: string[]) {
    const user = await requireAuth(req);

    if (!allowedRoles.includes(user.role)) {
        throw new Error("Insufficient permissions");
    }

    return user;
}

/**
 * Helper to handle auth errors in route handlers
 */
export function handleAuthError(error: any) {
    if (error.message === "No token provided") {
        return NextResponse.json(
            { message: "Authentication required" },
            { status: 401 }
        );
    }

    if (error.message === "Invalid or expired token") {
        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }

    if (error.message === "Insufficient permissions") {
        return NextResponse.json(
            { message: "Insufficient permissions" },
            { status: 403 }
        );
    }

    return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
    );
}
