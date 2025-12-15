import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const rows = await query<{
            id: number;
            name: string;
            segment_industri: string;
            status_pelanggan: string;
            pln_group_segment_id: number;
            segment_name: string;
            is_active: boolean;
        }>(`
      SELECT 
        c.id, c.name, c.segment_industri, c.status_pelanggan,
        c.pln_group_segment_id, c.is_active,
        seg.name AS segment_name
      FROM master_customer c
      LEFT JOIN master_segment_pln_group seg ON c.pln_group_segment_id = seg.id
      WHERE c.is_active = TRUE
      ORDER BY c.name
    `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { message: "Failed to fetch customers" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json(
                { message: "name is required" },
                { status: 400 }
            );
        }

        const sql = `
      INSERT INTO master_customer 
        (name, segment_industri, status_pelanggan, pln_group_segment_id, alamat, is_active)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE))
      RETURNING id, name, segment_industri, status_pelanggan, pln_group_segment_id, alamat, is_active
    `;
        const params = [
            body.name,
            body.segment_industri ?? null,
            body.status_pelanggan ?? null,
            body.pln_group_segment_id ?? null,
            body.alamat ?? null,
            body.is_active
        ];

        const rows = await query(sql, params);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json(
            { message: "Failed to create customer" },
            { status: 500 }
        );
    }
}
