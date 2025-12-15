import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        // Read the Excel file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json({ message: "Excel file is empty" }, { status: 400 });
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row: any = data[i];

            try {
                // Validate required fields
                if (!row.sbu_code || !row.customer_name || !row.nama_layanan || !row.est_revenue) {
                    errors.push(`Row ${i + 2}: Missing required fields`);
                    errorCount++;
                    continue;
                }

                // Get SBU ID
                const sbuResult = await query<{ id: number }>(
                    "SELECT id FROM master_sbu WHERE code = $1 AND is_active = TRUE",
                    [row.sbu_code]
                );

                if (sbuResult.length === 0) {
                    errors.push(`Row ${i + 2}: SBU code '${row.sbu_code}' not found`);
                    errorCount++;
                    continue;
                }

                const sbuId = sbuResult[0].id;

                // Get or create customer
                let customerId: number;
                const customerResult = await query<{ id: number }>(
                    "SELECT id FROM master_customer WHERE name = $1 AND is_active = TRUE",
                    [row.customer_name]
                );

                if (customerResult.length > 0) {
                    customerId = customerResult[0].id;
                } else {
                    // Create new customer with default segment
                    const newCustomer = await query<{ id: number }>(
                        "INSERT INTO master_customer (name, segment_pln_group_id, is_active) VALUES ($1, 1, TRUE) RETURNING id",
                        [row.customer_name]
                    );
                    customerId = newCustomer[0].id;
                }

                // Insert pipeline data
                await query(
                    `INSERT INTO pipeline_potensi (
            sbu_id, customer_id, nama_layanan, est_revenue, 
            warna_status_potensi, keterangan, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    [
                        sbuId,
                        customerId,
                        row.nama_layanan,
                        parseFloat(row.est_revenue),
                        row.warna_status_potensi || "KUNING",
                        row.keterangan || "",
                    ]
                );

                successCount++;
            } catch (error: any) {
                errors.push(`Row ${i + 2}: ${error.message}`);
                errorCount++;
            }
        }

        return NextResponse.json({
            message: "Upload completed",
            success: successCount,
            errors: errorCount,
            errorDetails: errors.slice(0, 10), // Return first 10 errors
        });
    } catch (error: any) {
        console.error("Error uploading Excel:", error);
        return NextResponse.json(
            { message: "Failed to upload Excel file", error: error.message },
            { status: 500 }
        );
    }
}
