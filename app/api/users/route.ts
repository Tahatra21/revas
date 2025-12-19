
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Helper to exclude keys from user object
function exclude<User, Key extends keyof User>(
    user: User,
    keys: Key[]
): Omit<User, Key> {
    const serializedUser = { ...user };
    for (const key of keys) {
        delete serializedUser[key];
    }
    return serializedUser;
}

export async function GET() {
    try {
        const users = await prisma.users.findMany({
            orderBy: { username: "asc" },
        });

        // Remove passwords from response
        const safeUsers = users.map((user: any) => exclude(user, ["password_hash"]));
        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, email, password, full_name, role } = body;

        if (!username || !email || !password) {
            return NextResponse.json(
                { message: "Username, email, and password are required" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "Username or email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await prisma.users.create({
            data: {
                username,
                email,
                password_hash,
                full_name,
                role: role || "user", // Default to 'user'
                is_active: true,
            },
        });

        return NextResponse.json(exclude(newUser as any, ["password_hash"]), { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, password, role, full_name, is_active } = body;

        if (!id) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (role) dataToUpdate.role = role;
        if (full_name) dataToUpdate.full_name = full_name;
        if (typeof is_active === "boolean") dataToUpdate.is_active = is_active;
        if (password) {
            dataToUpdate.password_hash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.users.update({
            where: { id: Number(id) },
            data: {
                ...dataToUpdate,
                updated_at: new Date(),
            },
        });

        return NextResponse.json(exclude(updatedUser as any, ["password_hash"]));
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        // Check if removing last admin? optional safety

        await prisma.users.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
    }
}
