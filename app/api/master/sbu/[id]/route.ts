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
            `SELECT id, code, name, is_active
       FROM master_sbu
       WHERE id = $1`,
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

        if (!body.code || !body.name) {
            return NextResponse.json(
                { message: "code and name are required" },
                { status: 400 }
            );
        }

        const sql = `
      UPDATE master_sbu
         SET code = $1,
             name = $2,
             is_active = $3
       WHERE id = $4
       RETURNING id, code, name, is_active
    `;
        const values = [
            body.code,
            body.name,
            body.is_active !== undefined ? body.is_active : true,
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
