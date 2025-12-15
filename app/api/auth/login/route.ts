import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { message: "Username and password are required" },
                { status: 400 }
            );
        }

        // Find user by username
        const users = await query<{
            id: number;
            username: string;
            email: string;
            password_hash: string;
            full_name: string;
            role: string;
            sbu_id: number | null;
            is_active: boolean;
        }>(
            `SELECT id, username, email, password_hash, full_name, role, sbu_id, is_active
       FROM users
       WHERE username = $1`,
            [username]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { message: "Invalid username or password" },
                { status: 401 }
            );
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return NextResponse.json(
                { message: "Account is disabled" },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: "Invalid username or password" },
                { status: 401 }
            );
        }

        // Update last login
        await query(
            "UPDATE users SET last_login = NOW() WHERE id = $1",
            [user.id]
        );

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            sbuId: user.sbu_id || undefined,
        });

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                sbuId: user.sbu_id,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
