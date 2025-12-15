import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const rows = await query<{
            id: number;
            code: string;
            name: string;
            is_active: boolean;
        }>("SELECT id, code, name, is_active FROM master_region WHERE is_active = TRUE ORDER BY code");

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching regions:", error);
        return NextResponse.json(
            { message: "Failed to fetch regions" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.code || !body.name) {
            return NextResponse.json(
                { message: "code and name are required" },
                { status: 400 }
            );
        }

        const sql = `
      INSERT INTO master_region (code, name, is_active)
      VALUES ($1, $2, COALESCE($3, TRUE))
      RETURNING id, code, name, is_active
    `;
        const params = [body.code, body.name, body.is_active];

        const rows = await query(sql, params);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating region:", error);

        if (error.code === "23505") {
            return NextResponse.json(
                { message: "Region code already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "Failed to create region" },
            { status: 500 }
        );
    }
}
