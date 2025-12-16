import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import ExcelJS from "exceljs";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const year = Number(formData.get("year"));

        if (!file) {
            return NextResponse.json(
                { message: "No file uploaded" },
                { status: 400 }
            );
        }

        if (!year) {
            return NextResponse.json(
                { message: "Year is required" },
                { status: 400 }
            );
        }

        console.log(`Processing target bulk upload for year ${year}`);

        // Read file
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error("No worksheet found in file");
        }

        // Find header row (skip instruction row if exists)
        let headerRowIdx = -1;
        worksheet.eachRow((row, rowNumber) => {
            const firstCell = row.getCell(1).value?.toString().toUpperCase() || "";
            // Look for "SBU CODE" in the first cell (may have space or without space)
            if (firstCell.replace(/\s+/g, '').includes("SBUCODE") ||
                (firstCell.includes("SBU") && firstCell.includes("CODE"))) {
                headerRowIdx = rowNumber;
                return;
            }
        });

        if (headerRowIdx === -1) {
            throw new Error("Header row not found. Expected 'SBU Code' column in first cell.");
        }

        console.log(`Found header at row ${headerRowIdx}`);

        // Find column indices
        const headerRow = worksheet.getRow(headerRowIdx);
        let colSbuCode = -1;
        let colTargetRkap = -1;
        let colCoTahunBerjalan = -1;
        let colTargetNr = -1;

        headerRow.eachCell((cell, colNumber) => {
            const header = cell.value?.toString().toUpperCase() || "";
            if (header.includes("SBU") && header.includes("CODE")) colSbuCode = colNumber;
            else if (header.includes("TARGET") && header.includes("RKAP")) colTargetRkap = colNumber;
            else if (header.includes("CO") && header.includes("TAHUN")) colCoTahunBerjalan = colNumber;
            else if (header.includes("TARGET") && header.includes("NR")) colTargetNr = colNumber;
        });

        if (colSbuCode === -1 || colTargetRkap === -1 || colCoTahunBerjalan === -1 || colTargetNr === -1) {
            throw new Error("Required columns not found. Expected: SBU Code, Target RKAP, CO Tahun Berjalan, Target NR");
        }

        console.log(`Columns - SBU: ${colSbuCode}, RKAP: ${colTargetRkap}, CO: ${colCoTahunBerjalan}, NR: ${colTargetNr}`);

        // Fetch all SBUs for validation
        const sbus = await query(`SELECT id, code FROM master_sbu WHERE is_active = TRUE`);
        const sbuMap = new Map(sbus.map((s: any) => [s.code.toUpperCase(), s.id]));

        // Collect data
        const targets: any[] = [];
        const errors: string[] = [];
        let successCount = 0;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= headerRowIdx) return;

            const sbuCode = row.getCell(colSbuCode).value?.toString().trim().toUpperCase();
            if (!sbuCode) return; // Skip empty rows

            const sbuId = sbuMap.get(sbuCode);
            if (!sbuId) {
                errors.push(`Row ${rowNumber}: SBU '${sbuCode}' not found in database`);
                return;
            }

            // Parse target values
            const targetRkap = Number(row.getCell(colTargetRkap).value) || 0;
            const coTahunBerjalan = Number(row.getCell(colCoTahunBerjalan).value) || 0;
            const targetNr = Number(row.getCell(colTargetNr).value) || 0;

            targets.push({
                sbuId,
                sbuCode,
                targetRkap,
                coTahunBerjalan,
                targetNr
            });
        });

        console.log(`Collected ${targets.length} target records`);

        // Batch insert/update in transaction
        await query('BEGIN');

        for (const target of targets) {
            try {
                await query(`
                    INSERT INTO revenue_target_yearly (
                        year, sbu_id, kategori, target_amount,
                        target_rkap, co_tahun_berjalan, target_nr
                    )
                    VALUES ($1, $2, 'TOTAL', 0, $3, $4, $5)
                    ON CONFLICT (year, sbu_id)
                    DO UPDATE SET
                        target_rkap = EXCLUDED.target_rkap,
                        co_tahun_berjalan = EXCLUDED.co_tahun_berjalan,
                        target_nr = EXCLUDED.target_nr,
                        updated_at = NOW()
                `, [year, target.sbuId, target.targetRkap, target.coTahunBerjalan, target.targetNr]);

                successCount++;
            } catch (error: any) {
                errors.push(`SBU ${target.sbuCode}: ${error.message}`);
            }
        }

        await query('COMMIT');

        console.log(`Upload complete - Success: ${successCount}, Errors: ${errors.length}`);

        return NextResponse.json({
            message: "Bulk upload completed",
            successCount,
            totalRows: targets.length,
            errors: errors.length > 0 ? errors : undefined
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
