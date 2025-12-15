import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
    try {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Pipeline Template
        const pipelineData = [
            {
                sbu_code: "SBU01",
                customer_name: "PT Example Customer",
                nama_layanan: "Internet Dedicated 100 Mbps",
                est_revenue: 50000000,
                warna_status_potensi: "HIJAU",
                keterangan: "Prospek bagus, sudah tahap negosiasi",
            },
            {
                sbu_code: "SBU02",
                customer_name: "PT Another Customer",
                nama_layanan: "Cloud Storage 1TB",
                est_revenue: 25000000,
                warna_status_potensi: "KUNING",
                keterangan: "Masih dalam tahap presentasi",
            },
        ];

        const pipelineSheet = XLSX.utils.json_to_sheet(pipelineData);

        // Set column widths
        pipelineSheet["!cols"] = [
            { wch: 12 }, // sbu_code
            { wch: 30 }, // customer_name
            { wch: 35 }, // nama_layanan
            { wch: 15 }, // est_revenue
            { wch: 20 }, // warna_status_potensi
            { wch: 40 }, // keterangan
        ];

        XLSX.utils.book_append_sheet(workbook, pipelineSheet, "Pipeline Data");

        // Instructions Sheet
        const instructions = [
            { Field: "sbu_code", Description: "Kode SBU (wajib diisi, harus ada di master SBU)", Example: "SBU01" },
            { Field: "customer_name", Description: "Nama customer (wajib diisi)", Example: "PT Example Customer" },
            { Field: "nama_layanan", Description: "Nama layanan/produk (wajib diisi)", Example: "Internet Dedicated 100 Mbps" },
            { Field: "est_revenue", Description: "Estimasi revenue dalam Rupiah (wajib diisi, angka saja)", Example: "50000000" },
            { Field: "warna_status_potensi", Description: "Status: HIJAU/KUNING/MERAH (opsional, default: KUNING)", Example: "HIJAU" },
            { Field: "keterangan", Description: "Keterangan tambahan (opsional)", Example: "Prospek bagus" },
        ];

        const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
        instructionsSheet["!cols"] = [
            { wch: 25 },
            { wch: 60 },
            { wch: 30 },
        ];

        XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        // Return as downloadable file
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment; filename=Pipeline_Upload_Template.xlsx",
            },
        });
    } catch (error: any) {
        console.error("Error generating template:", error);
        return NextResponse.json(
            { message: "Failed to generate template", error: error.message },
            { status: 500 }
        );
    }
}
