import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(_req: Request, props: Params) {
    const params = await props.params;
    try {
        const id = Number(params.id);
        const rows = await query(
            "SELECT id, code, name, is_active FROM master_region WHERE id = $1",
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Region not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error fetching region:", error);
        return NextResponse.json(
            { message: "Failed to fetch region" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request, props: Params) {
    const params = await props.params;
    try {
        const id = Number(params.id);
        const body = await req.json();

        const sql = `
      UPDATE master_region
         SET code = COALESCE($1, code),
             name = COALESCE($2, name),
             is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING id, code, name, is_active
    `;
        const values = [body.code ?? null, body.name ?? null, body.is_active ?? null, id];

        const rows = await query(sql, values);

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Region not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error updating region:", error);
        return NextResponse.json(
            { message: "Failed to update region" },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, props: Params) {
    const params = await props.params;
    try {
        const id = Number(params.id);
        const rows = await query(
            "UPDATE master_region SET is_active = FALSE WHERE id = $1 RETURNING id",
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Region not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting region:", error);
        return NextResponse.json(
            { message: "Failed to delete region" },
            { status: 500 }
        );
    }
}
