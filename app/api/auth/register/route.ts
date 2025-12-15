import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, email, password, fullName, role, sbuId } = body;

        // Validation
        if (!username || !email || !password) {
            return NextResponse.json(
                { message: "Username, email, and password are required" },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUsers = await query(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (existingUsers.length > 0) {
            return NextResponse.json(
                { message: "Username or email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert new user
        const sql = `
      INSERT INTO users (username, email, password_hash, full_name, role, sbu_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, full_name, role, sbu_id
    `;
        const params = [
            username,
            email,
            passwordHash,
            fullName || null,
            role || "user",
            sbuId || null,
        ];

        const users = await query<{
            id: number;
            username: string;
            email: string;
            full_name: string;
            role: string;
            sbu_id: number | null;
        }>(sql, params);

        const user = users[0];

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            sbuId: user.sbu_id || undefined,
        });

        return NextResponse.json(
            {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    sbuId: user.sbu_id,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
