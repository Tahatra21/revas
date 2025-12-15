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
            `
      SELECT 
        p.*,
        s.code AS "sbuCode",
        c.name AS "customerName"
      FROM pipeline_potensi p
      LEFT JOIN master_sbu s ON p.sbu_id = s.id
      LEFT JOIN master_customer c ON p.customer_id = c.id
      WHERE p.id = $1
      `,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Pipeline not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Error fetching pipeline:", error);
        return NextResponse.json(
            { message: "Failed to fetch pipeline" },
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
      UPDATE pipeline_potensi
         SET sbu_id = COALESCE($1, sbu_id),
             customer_id = COALESCE($2, customer_id),
             nama_layanan = COALESCE($3, nama_layanan),
             est_revenue = COALESCE($4, est_revenue),
             warna_status_potensi = COALESCE($5, warna_status_potensi),
             current_status = COALESCE($6, current_status),
             updated_at = NOW()
       WHERE id = $7
       RETURNING id
    `;
        const paramsSql = [
            body.sbuId ?? null,
            body.customerId ?? null,
            body.namaLayanan ?? null,
            body.estRevenue ?? null,
            body.warnaStatusPotensi ?? null,
            body.currentStatus ?? null,
            id,
        ];

        const rows = await query(sql, paramsSql);

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Pipeline not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ id });
    } catch (error) {
        console.error("Error updating pipeline:", error);
        return NextResponse.json(
            { message: "Failed to update pipeline" },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, props: Params) {
    const params = await props.params;
    try {
        const id = Number(params.id);
        const rows = await query(
            "DELETE FROM pipeline_potensi WHERE id = $1 RETURNING id",
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Pipeline not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting pipeline:", error);
        return NextResponse.json(
            { message: "Failed to delete pipeline" },
            { status: 500 }
        );
    }
}
