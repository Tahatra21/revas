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
            `SELECT s.id, s.code, s.name, s.region_id, s.is_active, r.code AS region_code
       FROM master_sbu s
       LEFT JOIN master_region r ON s.region_id = r.id
       WHERE s.id = $1`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: "SBU not found" }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error fetching SBU:", error);
        return NextResponse.json({ message: "Failed to fetch SBU" }, { status: 500 });
    }
}

export async function PUT(req: Request, props: Params) {
    const params = await props.params;
    try {
        const id = Number(params.id);
        const body = await req.json();

        const sql = `
      UPDATE master_sbu
         SET code = COALESCE($1, code),
             name = COALESCE($2, name),
             region_id = COALESCE($3, region_id),
             is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, code, name, region_id, is_active
    `;
        const values = [
            body.code ?? null,
            body.name ?? null,
            body.region_id ?? null,
            body.is_active ?? null,
            id
        ];

        const rows = await query(sql, values);

        if (rows.length === 0) {
            return NextResponse.json({ message: "SBU not found" }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error updating SBU:", error);
        return NextResponse.json({ message: "Failed to update SBU" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, props: Params) {
    const params = await props.params;
    try {
        const id = Number(params.id);
        const rows = await query(
            "UPDATE master_sbu SET is_active = FALSE WHERE id = $1 RETURNING id",
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: "SBU not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting SBU:", error);
        return NextResponse.json({ message: "Failed to delete SBU" }, { status: 500 });
    }
}
