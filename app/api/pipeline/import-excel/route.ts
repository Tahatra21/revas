import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import ExcelJS from "exceljs";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { message: "No file uploaded" },
                { status: 400 }
            );
        }

        console.log(`Processing pipeline bulk upload: ${file.name}`);

        // Read file
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error("No worksheet found in file");
        }

        // Header is at row 2 based on analysis
        const headerRowIdx = 2;

        // Fetch all SBUs and Customers for validation
        const sbus = await query(`SELECT id, code FROM master_sbu WHERE is_active = TRUE`);
        const sbuMap = new Map(sbus.map((s: any) => [s.code.toUpperCase(), s.id]));

        // Fetch PLN Group segments
        const plnGroups = await query(`SELECT id, name, code FROM master_segment_pln_group WHERE is_active = TRUE`);
        const plnGroupMap = new Map(plnGroups.map((g: any) => [g.name.toUpperCase(), g.id]));

        // Get or create customers
        const customers = await query(`SELECT id, name FROM master_customer`);
        const customerMap = new Map(customers.map((c: any) => [c.name.toUpperCase(), c.id]));

        // Collect data
        const pipelines: any[] = [];
        const errors: string[] = [];
        let processedCount = 0;
        let skippedCount = 0;

        // Process rows starting from row 3 (after header at row 2)
        worksheet.eachRow(async (row, rowNumber) => {
            if (rowNumber <= headerRowIdx) return;

            try {
                // Map columns based on analysis
                // A=No, B=SBU, C=Jenis Layanan, D=Services Category, E=Customer Group, 
                // F=Customer Name, G=Segmen Industri, H=Bantu, I=Type, J=Layanan,
                // K=Kapasitas, L=Satuan,  M=Originating, N=Terminating, O=Instalasi, 
                // P=Sewa, Q=QTY, R=Target Aktivasi, S=Status, T=Est Revenue, 
                // U=Category 2026, V=Sub Category

                const sbuCode = row.getCell(2).value?.toString().trim(); // Column B
                const jenisLayanan = row.getCell(3).value?.toString() || null;
                const servicesCategory = row.getCell(4).value?.toString() || null;
                const customerGroup = row.getCell(5).value?.toString() || null;
                const customerName = row.getCell(6).value?.toString() || null;
                const segmenIndustri = row.getCell(7).value?.toString() || null;
                const type = row.getCell(9).value?.toString() || null; // Column I
                const namaLayanan = row.getCell(10).value?.toString() || null; // Column J
                const kapasitas = row.getCell(11).value?.toString() || null;
                const satuanKapasitas = row.getCell(12).value?.toString() || null;
                const originating = row.getCell(13).value?.toString() || null;
                const terminating = row.getCell(14).value?.toString() || null;
                const instalasi = Number(row.getCell(15).value) || 0; // Column O (OTC)
                const sewa = Number(row.getCell(16).value) || 0; // Column P (MRC/Monthly)
                const qty = Number(row.getCell(17).value) || 1; // Column Q
                const targetAktivasi = row.getCell(18).value; // Column R
                const statusColor = row.getCell(19).value?.toString()?.toUpperCase() || 'MERAH'; // Column S
                const estRevenue = Number(row.getCell(20).value) || 0; // Column T
                const category2026 = row.getCell(21).value?.toString() || null;
                const subCategory = row.getCell(22).value?.toString() || null;

                // Skip rows without essential data (only SBU is required)
                if (!sbuCode) {
                    skippedCount++;
                    return;
                }

                // Use placeholder if layanan is empty
                const finalNamaLayanan = namaLayanan || 'Unknown Service';

                // Validate SBU
                const sbuId = sbuMap.get(sbuCode.toUpperCase());
                if (!sbuId) {
                    errors.push(`Row ${rowNumber}: SBU '${sbuCode}' not found`);
                    return;
                }

                // Get or create customer
                let customerId = null;
                if (customerName) {
                    customerId = customerMap.get(customerName.toUpperCase());
                    if (!customerId) {
                        // Look up PLN Group
                        let plnGroupId = null;
                        if (customerGroup) {
                            plnGroupId = plnGroupMap.get(customerGroup.toUpperCase());
                            if (!plnGroupId) {
                                // Create new PLN group if doesn't exist
                                const newGroup = await query(`
                                    INSERT INTO master_segment_pln_group (name, code, is_active)
                                    VALUES ($1, $2, TRUE)
                                    RETURNING id
                                `, [customerGroup, customerGroup.toUpperCase().replace(/\s+/g, '_')]);
                                plnGroupId = newGroup[0].id;
                                plnGroupMap.set(customerGroup.toUpperCase(), plnGroupId);
                            }
                        }

                        // Create customer with PLN group
                        const newCustomer = await query(`
                            INSERT INTO master_customer (name, segment_industri, pln_group_segment_id, is_active)
                            VALUES ($1, $2, $3, TRUE)
                            RETURNING id
                        `, [customerName, segmenIndustri, plnGroupId]);
                        customerId = newCustomer[0].id;
                        customerMap.set(customerName.toUpperCase(), customerId);
                    } else {
                        // Update existing customer with PLN group if we have one
                        if (customerGroup) {
                            let plnGroupId = plnGroupMap.get(customerGroup.toUpperCase());
                            if (!plnGroupId) {
                                // Create new PLN group if doesn't exist
                                const newGroup = await query(`
                                    INSERT INTO master_segment_pln_group (name, code, is_active)
                                    VALUES ($1, $2, TRUE)
                                    RETURNING id
                                `, [customerGroup, customerGroup.toUpperCase().replace(/\s+/g, '_')]);
                                plnGroupId = newGroup[0].id;
                                plnGroupMap.set(customerGroup.toUpperCase(), plnGroupId);
                            }

                            // Update existing customer with group
                            await query(`
                                UPDATE master_customer 
                                SET pln_group_segment_id = $1
                                WHERE id = $2 AND (pln_group_segment_id IS NULL OR pln_group_segment_id != $1)
                            `, [plnGroupId, customerId]);
                        }
                    }
                } else {
                    // Create placeholder customer
                    const placeholderName = `Unknown Customer (Row ${rowNumber})`;
                    const newCustomer = await query(`
                        INSERT INTO master_customer (name, is_active)
                        VALUES ($1, TRUE)
                        RETURNING id
                    `, [placeholderName]);
                    customerId = newCustomer[0].id;
                }

                // Normalize status color
                let warnaStatus = 'MERAH';
                if (statusColor && (statusColor.includes('HIJAU') || statusColor.includes('GREEN'))) {
                    warnaStatus = 'HIJAU';
                } else if (statusColor && (statusColor.includes('KUNING') || statusColor.includes('YELLOW'))) {
                    warnaStatus = 'KUNING';
                }

                // Parse target aktivasi date
                let targetDate = null;
                if (targetAktivasi) {
                    try {
                        if (targetAktivasi instanceof Date) {
                            targetDate = targetAktivasi.toISOString().split('T')[0];
                        } else if (typeof targetAktivasi === 'number') {
                            // Excel serial date number
                            const excelEpoch = new Date(1899, 11, 30);
                            const date = new Date(excelEpoch.getTime() + targetAktivasi * 86400000);
                            targetDate = date.toISOString().split('T')[0];
                        } else if (typeof targetAktivasi === 'string') {
                            targetDate = targetAktivasi;
                        }
                    } catch (e) {
                        console.error(`Failed to parse date for row ${rowNumber}:`, e);
                    }
                }

                // Normalizing Segment Industri
                let normalizedSegmenIndustri = segmenIndustri;
                if (normalizedSegmenIndustri) {
                    const segmentUpper = normalizedSegmenIndustri.toUpperCase();

                    if (segmentUpper === 'DISTRIBUSI') normalizedSegmenIndustri = 'Distribusi';
                    else if (['PEMBANGKIT', 'PEMBANGKITAN'].includes(segmentUpper)) normalizedSegmenIndustri = 'Pembangkitan';
                    else if (segmentUpper === 'TRANSMISI') normalizedSegmenIndustri = 'Transmisi';
                    else if (segmentUpper === 'PELAYANAN PELANGGAN') normalizedSegmenIndustri = 'Pelayanan Pelanggan';
                    else if (segmentUpper === 'SUPPORT') normalizedSegmenIndustri = 'Support';
                    // Fallback: Title Case for unknown segments
                    else {
                        normalizedSegmenIndustri = normalizedSegmenIndustri.charAt(0).toUpperCase() + normalizedSegmenIndustri.slice(1).toLowerCase();
                    }
                }

                pipelines.push({
                    sbuId,
                    customerId,
                    jenisLayanan,
                    segmenIndustri: normalizedSegmenIndustri, // Use normalized value
                    type,
                    namaLayanan: finalNamaLayanan,
                    kapasitas,
                    satuanKapasitas,
                    originating,
                    terminating,
                    nilaiOtc: instalasi,
                    nilaiMrc: sewa,
                    qty,
                    estRevenue: estRevenue || (instalasi + (sewa * qty)),
                    warnaStatus,
                    periodeSnapshot: new Date().toISOString().split('T')[0], // Current date
                    targetAktivasi: targetDate,
                    category2026,
                    subCategory,
                    rowNumber
                });

                processedCount++;
            } catch (error: any) {
                errors.push(`Row ${rowNumber}: ${error.message}`);
            }
        });

        console.log(`Collected ${pipelines.length} pipeline records`);

        // Batch insert in transaction
        await query('BEGIN');

        let successCount = 0;
        for (const pipeline of pipelines) {
            try {
                await query(`
                    INSERT INTO pipeline_potensi (
                        sbu_id, customer_id, jenis_layanan, segment_industri,
                        type_pendapatan, nama_layanan, kapasitas, satuan_kapasitas,
                        originating, terminating, nilai_otc, nilai_mrc, qty,
                        est_revenue, warna_status_potensi, periode_snapshot, target_aktivasi,
                        category_2026, sub_category
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                `, [
                    pipeline.sbuId,
                    pipeline.customerId,
                    pipeline.jenisLayanan,
                    pipeline.segmenIndustri,
                    pipeline.type,
                    pipeline.namaLayanan,
                    pipeline.kapasitas,
                    pipeline.satuanKapasitas,
                    pipeline.originating,
                    pipeline.terminating,
                    pipeline.nilaiOtc,
                    pipeline.nilaiMrc,
                    pipeline.qty,
                    pipeline.estRevenue,
                    pipeline.warnaStatus,
                    pipeline.periodeSnapshot,
                    pipeline.targetAktivasi,
                    pipeline.category2026,
                    pipeline.subCategory
                ]);

                successCount++;
            } catch (error: any) {
                errors.push(`Row ${pipeline.rowNumber}: ${error.message}`);
            }
        }

        await query('COMMIT');

        console.log(`Upload complete - Success: ${successCount}, Errors: ${errors.length}, Skipped: ${skippedCount}`);

        return NextResponse.json({
            message: "Bulk upload completed",
            successCount,
            totalProcessed: processedCount,
            skippedCount,
            errors: errors.length > 0 ? errors.slice(0, 100) : undefined // Limit errors to 100
        });

    } catch (error: any) {
        console.error("Error processing bulk upload:", error);

        try {
            await query('ROLLBACK');
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError);
        }

        return NextResponse.json(
            { message: "Failed to process bulk upload", error: error.message },
            { status: 500 }
        );
    }
}
