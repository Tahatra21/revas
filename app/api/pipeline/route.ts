import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sbu = searchParams.get("sbu");
        const status = searchParams.get("status");
        const year = searchParams.get("year");
        const month = searchParams.get("month");

        let sql = `
      SELECT 
        p.id,
        s.code AS "sbuCode",
        c.name AS "customerName",
        p.nama_layanan AS "namaLayanan",
        p.est_revenue AS "estRevenue",
        p.current_status AS "currentStatus",
        p.warna_status_potensi AS "warnaStatusPotensi",
        p.periode_snapshot AS "periodeSnapshot"
      FROM pipeline_potensi p
      LEFT JOIN master_sbu s ON p.sbu_id = s.id
      LEFT JOIN master_customer c ON p.customer_id = c.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (sbu) {
            params.push(Number(sbu));
            sql += ` AND p.sbu_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            sql += ` AND p.warna_status_potensi = $${params.length}`;
        }

        if (year) {
            params.push(Number(year));
            sql += ` AND EXTRACT(YEAR FROM p.periode_snapshot) = $${params.length}`;
        }

        if (month) {
            params.push(Number(month));
            sql += ` AND EXTRACT(MONTH FROM p.periode_snapshot) = $${params.length}`;
        }

        sql += " ORDER BY p.updated_at DESC";

        const rows = await query(sql, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching pipeline:", error);
        return NextResponse.json(
            { message: "Failed to fetch pipeline" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.sbuId || !body.customerId || !body.namaLayanan || !body.estRevenue || !body.warnaStatusPotensi) {
            return NextResponse.json(
                { message: "sbuId, customerId, namaLayanan, estRevenue, warnaStatusPotensi are required" },
                { status: 400 }
            );
        }

        const sql = `
      INSERT INTO pipeline_potensi
      (
        sbu_id,
        customer_id,
        jenis_layanan,
        service_category_id,
        service_category2_id,
        segment_industri,
        b2b_flag,
        type_pendapatan,
        nama_layanan,
        kapasitas,
        satuan_kapasitas,
        originating,
        terminating,
        nilai_otc,
        nilai_mrc,
        est_revenue,
        mapping_revenue,
        sumber_anggaran,
        fungsi,
        no_invoice,
        warna_status_potensi,
        current_status,
        periode_snapshot
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,$21,$22, NOW()
      )
      RETURNING id
    `;

        const params = [
            body.sbuId,
            body.customerId,
            body.jenisLayanan ?? null,
            body.serviceCategoryId ?? null,
            body.serviceCategory2Id ?? null,
            body.segmentIndustri ?? null,
            body.b2bFlag ?? null,
            body.typePendapatan ?? null,
            body.namaLayanan,
            body.kapasitas ?? null,
            body.satuanKapasitas ?? null,
            body.originating ?? null,
            body.terminating ?? null,
            body.nilaiOtc ?? null,
            body.nilaiMrc ?? null,
            body.estRevenue,
            body.mappingRevenue ?? null,
            body.sumberAnggaran ?? null,
            body.fungsi ?? null,
            body.noInvoice ?? null,
            body.warnaStatusPotensi,
            body.currentStatus ?? null,
        ];

        const rows = await query(sql, params);
        return NextResponse.json({ id: rows[0].id }, { status: 201 });
    } catch (error) {
        console.error("Error creating pipeline:", error);
        return NextResponse.json(
            { message: "Failed to create pipeline" },
            { status: 500 }
        );
    }
}
