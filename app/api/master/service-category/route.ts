import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const rows = await query<{
            id: number;
            code: string;
            name: string;
            level: number;
            parent_id: number | null;
            parent_name: string | null;
            is_active: boolean;
        }>(`
      SELECT 
        sc.id, sc.code, sc.name, sc.level, sc.parent_id, sc.is_active,
        p.name AS parent_name
      FROM master_service_category sc
      LEFT JOIN master_service_category p ON sc.parent_id = p.id
      WHERE sc.is_active = TRUE
      ORDER BY sc.level, sc.code
    `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching service categories:", error);
        return NextResponse.json(
            { message: "Failed to fetch service categories" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.code || !body.name || !body.level) {
            return NextResponse.json(
                { message: "code, name, and level are required" },
                { status: 400 }
            );
        }

        if (![1, 2].includes(body.level)) {
            return NextResponse.json(
                { message: "level must be 1 or 2" },
                { status: 400 }
            );
        }

        const sql = `
      INSERT INTO master_service_category (code, name, level, parent_id, is_active)
      VALUES ($1, $2, $3, $4, COALESCE($5, TRUE))
      RETURNING id, code, name, level, parent_id, is_active
    `;
        const params = [body.code, body.name, body.level, body.parent_id ?? null, body.is_active];

        const rows = await query(sql, params);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating service category:", error);

        if (error.code === "23505") {
            return NextResponse.json(
                { message: "Service category code already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "Failed to create service category" },
            { status: 500 }
        );
    }
}
