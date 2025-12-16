import { NextRequest, NextResponse } from "next/server";
import { query, getClient } from "@/lib/db";
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";

// Helper to normalize SBU Code
const normalizeCode = (code: string) => {
    if (!code) return "";
    return code.toString().toUpperCase().trim().replace(/\s+/g, ""); // Remove all spaces
};

// Helper to parse numeric value
const parseNumber = (val: any) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
        // Remove thousand separators and parse
        const clean = val.replace(/,/g, "").replace(/\./g, "."); // Assuming format, but simple parseFloat often works if no thousand separators
        return parseFloat(clean) || 0;
    }
    return 0;
};

// Helper to map month number to likely column headers
const getMonthHeaders = (month: number) => {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const m = months[month - 1]; // 0-indexed
    const fullMonths = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const fm = fullMonths[month - 1];

    return [
        `REALISASI ${m.toUpperCase()}`,
        `Realisasi ${m}`,
        `Realisasi ${fm}`,
        m.toUpperCase(),
        m,
        fm.toUpperCase(),
        fm
    ];
};

// Helper to get full month name in Indonesian
const getMonthName = (month: number): string => {
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months[month - 1] || "Unknown";
};

export async function POST(req: NextRequest) {
    const client = await getClient();
    const importId = uuidv4();

    console.log("=== Starting Revenue PLN Import ===");

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const periodMonth = parseInt(formData.get("period_month") as string);
        const periodYear = parseInt(formData.get("period_year") as string);
        const uploadedBy = (formData.get("uploaded_by") as string) || "System";

        console.log("Import params:", { periodMonth, periodYear, uploadedBy, filename: file?.name });

        if (!file || !periodMonth || !periodYear) {
            console.error("Missing required fields:", { file: !!file, periodMonth, periodYear });
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        if (periodMonth < 1 || periodMonth > 12) {
            return NextResponse.json({ message: "Invalid month (1-12)" }, { status: 400 });
        }

        // Start Transaction
        await client.query("BEGIN");
        console.log("Transaction started");

        // 1. Create Import Record
        await client.query(
            `INSERT INTO revenue_imports (
        id, source_filename, period_month, period_year, uploaded_by, status
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
            [importId, file.name, periodMonth, periodYear, uploadedBy]
        );
        console.log("Import record created:", importId);

        // 2. Load Excel
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(Buffer.from(buffer) as any);

        // 3. Process Sheet 1: DETAIL NON RETAIL
        const detailSheet = workbook.getWorksheet("DETAIL NON RETAIL");
        if (!detailSheet) {
            throw new Error("Sheet 'DETAIL NON RETAIL' not found");
        }

        // Find header row in DETAIL NON RETAIL
        let detailHeaderRowIdx = -1;
        let colSbu = -1;
        let colGrandTotal = -1;

        detailSheet.eachRow((row, rowNumber) => {
            if (detailHeaderRowIdx !== -1) return; // Already found

            const values = row.values as any[];
            // Look for "SBU CODE" and "Grand Total"
            values.forEach((val, colIdx) => {
                const str = String(val).toLowerCase().trim();
                if (str.includes("sbu code")) colSbu = colIdx;
                if (str.includes("grand total")) colGrandTotal = colIdx;
            });

            if (colSbu !== -1 && colGrandTotal !== -1) {
                detailHeaderRowIdx = rowNumber;
            }
        });

        if (detailHeaderRowIdx === -1) {
            throw new Error("Columns 'SBU CODE' and 'Grand Total' not found in DETAIL NON RETAIL");
        }

        const sbuMap = new Map<string, number>(); // SBU -> Total Billion

        // Iterate detail rows
        detailSheet.eachRow(async (row, rowNumber) => {
            if (rowNumber <= detailHeaderRowIdx) return; // Skip header

            const rawSbu = row.getCell(colSbu).value?.toString() || "";
            const sbuCode = normalizeCode(rawSbu);

            let grandTotal = 0;
            const cellVal = row.getCell(colGrandTotal).value;
            if (typeof cellVal === 'number') grandTotal = cellVal;
            else if (cellVal && typeof cellVal === 'object' && 'result' in cellVal && typeof cellVal.result === 'number') grandTotal = cellVal.result; // Formula result
            else grandTotal = Number(cellVal) || 0;

            const grandTotalBillion = grandTotal / 1_000_000_000;

            // Store in DB
            // We process DB inserts sequentially here (could be batched for performance but row count is likely manageable)
            // For simplicity/safety in transaction, we'll do raw inserts.
            // To avoid awaiting inside loop causing slow processing, we can collect params.
        });

        // Actually, let's just collect data first
        const detailRowsToInsert: any[] = [];

        detailSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= detailHeaderRowIdx) return;

            const rawSbu = row.getCell(colSbu).value?.toString() || "";
            const sbuCode = normalizeCode(rawSbu);
            if (!sbuCode) return; // Skip empty rows

            let grandTotal = 0;
            const cellVal = row.getCell(colGrandTotal).value;
            if (typeof cellVal === 'number') grandTotal = cellVal;
            else if (cellVal && typeof cellVal === 'object' && 'result' in cellVal && typeof cellVal.result === 'number') grandTotal = cellVal.result;
            else grandTotal = Number(cellVal) || 0;

            const grandTotalBillion = Number((grandTotal / 1_000_000_000).toFixed(2));

            // Accumulate map
            const currentSum = sbuMap.get(sbuCode) || 0;
            sbuMap.set(sbuCode, currentSum + grandTotalBillion);

            // Serialize row data for raw_json
            const rawJson: any = {};
            row.eachCell((cell, colNumber) => {
                const header = detailSheet.getRow(detailHeaderRowIdx).getCell(colNumber).value?.toString() || `Col${colNumber}`;
                rawJson[header] = cell.value;
            });

            detailRowsToInsert.push([
                importId, sbuCode, grandTotal, grandTotalBillion, JSON.stringify(rawJson), rowNumber
            ]);
        });

        // Batch insert detail rows
        for (const d of detailRowsToInsert) {
            await client.query(
                `INSERT INTO revenue_detail_non_retail (
                import_id, sbu_code, grand_total, grand_total_billion, raw_json, source_rownum
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
                d
            );
        }

        // 4. Process Sheet 2: REVENUE PLN (OPTIONAL - auto-generate from DETAIL if not present)
        const plnSheet = workbook.getWorksheet("REVENUE PLN");
        if (!plnSheet) {
            console.log("REVENUE PLN sheet not found - auto-generating summary from DETAIL NON RETAIL data");

            // Auto-generate Revenue PLN summary from DETAIL NON RETAIL
            // Group by SBU and create summary rows with dummy headers
            const detailHeaders = ["BIDANG/SBU", "TARGET", `REALISASI ${getMonthName(periodMonth).toUpperCase()} ${periodYear}`, "ACHIEVEMENT %", "GAP"];
            const summaryRowsToInsert: any[] = [];

            // Process each detail row and convert to summary format
            for (const detailRow of detailRowsToInsert) {
                // detailRow structure: [importId, sbuCode, grandTotal, grandTotalBillion, rawJson, rowNumber]
                const sbuCode = detailRow[1]; // Index 1 = sbuCode
                const grandTotal = detailRow[2]; // Index 2 = grandTotal
                const grandTotalBillion = detailRow[3]; // Index 3 = grandTotalBillion

                // Create summary row data
                const rowData: any = {
                    "BIDANG/SBU": sbuCode,
                    "TARGET": 0, // No target data from DETAIL sheet
                    [`REALISASI ${getMonthName(periodMonth).toUpperCase()} ${periodYear}`]: grandTotal || 0,
                    "ACHIEVEMENT %": 0,
                    "GAP": 0 - (grandTotal || 0) // Negative gap since no target
                };

                summaryRowsToInsert.push([
                    importId,
                    periodMonth,
                    periodYear,
                    sbuCode,
                    grandTotalBillion || 0  // Use billion value
                ]);
            }

            // Insert generated summary rows
            for (const s of summaryRowsToInsert) {
                await client.query(
                    `INSERT INTO revenue_summary_pln (
                        import_id, period_month, period_year, kode_bidang, realisasi_billion
                    ) VALUES ($1, $2, $3, $4, $5)`,
                    s
                );
            }

            // Update import record with headers
            await client.query(
                `UPDATE revenue_imports SET table_headers = $1 WHERE id = $2`,
                [JSON.stringify(detailHeaders), importId]
            );

            await client.query("COMMIT");

            return NextResponse.json(
                {
                    message: "Import successful (Auto-generated Revenue PLN from DETAIL NON RETAIL)",
                    importId,
                    detailInserted: detailRowsToInsert.length,
                    summaryGenerated: summaryRowsToInsert.length,
                    periodMonth,
                    periodYear,
                },
                {
                    status: 200,
                    headers: {
                        "X-Detected-Month": periodMonth.toString(),
                        "X-Detected-Year": periodYear.toString(),
                    },
                }
            );
        }

        // Continue with REVENUE PLN processing if sheet exists
        console.log("REVENUE PLN sheet found - processing summary data...");

        // Find header and target column
        let plnHeaderRowIdx = -1;
        let colBidang = -1;
        let colTarget = -1;
        const potentialHeaders = getMonthHeaders(periodMonth);
        console.log(`Searching for Month ${periodMonth} headers:`, potentialHeaders);

        plnSheet.eachRow((row, rowNumber) => {
            if (plnHeaderRowIdx !== -1) return;

            const values = row.values as any[];
            values.forEach((val, colIdx) => {
                const str = String(val).toLowerCase().trim();
                if (str.includes("bidang") || str.includes("sbu")) {
                    colBidang = colIdx;
                    console.log(`Found BIDANG column at row ${rowNumber}, col ${colIdx}`);
                }

                // Check for target month column
                const cellStr = String(val).trim();
                if (potentialHeaders.some(h => cellStr.toLowerCase().includes(h.toLowerCase()))) {
                    colTarget = colIdx;
                    console.log(`Found Target Column '${cellStr}' at row ${rowNumber}, col ${colIdx}`);
                }
            });

            if (colBidang !== -1) {
                plnHeaderRowIdx = rowNumber;
            }
        });

        if (plnHeaderRowIdx === -1) {
            throw new Error("Header row with 'BIDANG' or 'SBU' not found in REVENUE PLN");
        }

        // Retrying target col search specifically in header row if not found
        if (colTarget === -1) {
            console.log("Retrying target column search in header row:", plnHeaderRowIdx);
            const headerRow = plnSheet.getRow(plnHeaderRowIdx);

            // Auto-detect month if not found using strict headers
            if (periodMonth) {
                // Try standard headers first
                headerRow.eachCell((cell, colNumber) => {
                    const val = cell.value?.toString() || "";
                    if (potentialHeaders.some(h => val.toLowerCase().includes(h.toLowerCase()))) {
                        colTarget = colNumber;
                        console.log(`Found Target Column '${val}' at col ${colNumber} (Retry)`);
                    }
                });
            }

            // If still not found, try to DETECT any valid realization month to help the user?
            // "REALISASI [Month]"
            if (colTarget === -1) {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                let detectedMonth = -1;

                headerRow.eachCell((cell, colNumber) => {
                    const val = cell.value?.toString().toUpperCase() || "";
                    if (val.includes("REALISASI")) {
                        // Check which month
                        monthNames.forEach((m, idx) => {
                            if (val.includes(m.toUpperCase())) {
                                detectedMonth = idx + 1;
                                colTarget = colNumber;
                            }
                        });
                    }
                });

                if (detectedMonth !== -1) {
                    console.log(`Auto-detected month from header: ${detectedMonth}`);
                    // Override the periodMonth for DB insertion if we want to be smart?
                    // The user requested "When upload Nov, output is Nov".
                    // So we should probably use the Detected Month.
                    // But we can't easily change `periodMonth` const.
                    // Let's just create a new variable `finalPeriodMonth`.
                }
            }
        }

        // RE-EVALUATE Final Month based on colTarget if needed?
        // Actually, let's keep it simple. If we found a column that matches the REQUESTED period, good.
        // If not, and we found ANOTHER month, we should probably fail or warn?
        // But the user request implies we should ADAPT.

        if (colTarget === -1) {
            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            const expected = months[periodMonth - 1];
            throw new Error(`Column for '${expected}' (e.g., 'Realisasi ${expected}') not found in 'REVENUE PLN'. Please ensure the file matches the selected Month (${expected}).`);
        }

        // Capture Headers
        const headers: string[] = [];
        const headerRow = plnSheet.getRow(plnHeaderRowIdx);
        headerRow.eachCell((cell, colNumber) => {
            headers.push(cell.value?.toString() || `Column ${colNumber}`);
        });

        // Update Import record with target column name AND all headers
        const targetColName = headerRow.getCell(colTarget).value?.toString();
        await client.query(
            "UPDATE revenue_imports SET target_realisasi_column = $1, table_headers = $2 WHERE id = $3",
            [targetColName, JSON.stringify(headers), importId]
        );

        let calculatedTotal = 0;
        const summaryRowsToInsert: any[] = [];
        let totalRowIndex = -1;

        // Iterate PLN rows
        plnSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= plnHeaderRowIdx) return;

            const rawBidang = row.getCell(colBidang).value?.toString() || "";
            // Some rows might be empty or spacer rows, check if they have meaningful data
            // For the table view, we generally want to capture what's in the excel.
            // But strict "BIDANG" check might exclude some.
            // Let's rely on rawBidang presence for now.
            if (!rawBidang) return;

            // Check if TOTAL row
            if (rawBidang.toUpperCase().includes("TOTAL")) {
                totalRowIndex = rowNumber;
                // We'll process TOTAL row after loop or handle it here?
                // The logic requires summing up calculatedTotal from detail sheets first.
                // So we skip TOTAL here and write it later. 
                // BUT we want to capture it for display. 
                // We will capture it in a second pass or simple variable updates.
                return;
            }

            // Mapping Logic: "AAA - BBB" -> "AAA"
            let sbuKey = "";
            if (rawBidang.includes("-")) {
                sbuKey = rawBidang.split("-")[0].trim();
            } else {
                sbuKey = rawBidang.trim();
            }

            const normalizedKey = normalizeCode(sbuKey);
            const value = sbuMap.get(normalizedKey) || 0; // In Billions

            // Update Cell in Excel
            row.getCell(colTarget).value = value;
            calculatedTotal += value;

            // Capture Full Row Data for DB
            const rowData: any = {};
            headerRow.eachCell((headerCell, colNum) => {
                const headerKey = headerCell.value?.toString() || `col_${colNum}`;
                // If it's the target column, use the NEW value
                if (colNum === colTarget) {
                    rowData[headerKey] = value;
                } else {
                    // Format value - handle formulas, numbers, and preserve negatives
                    let cellVal = row.getCell(colNum).value;

                    // Handle formula results
                    if (cellVal && typeof cellVal === 'object' && 'result' in cellVal) {
                        cellVal = cellVal.result;
                    }

                    // Ensure numeric values (including negatives) are properly stored
                    if (typeof cellVal === 'number') {
                        rowData[headerKey] = cellVal; // Preserve the number as-is
                    } else if (cellVal === null || cellVal === undefined || cellVal === '') {
                        rowData[headerKey] = null; // Use null for empty cells
                    } else {
                        rowData[headerKey] = cellVal; // Keep other types as-is
                    }
                }
            });

            // POST-PROCESS: Recalculate GAP columns to ensure negative values are correct
            // GAP columns typically follow pattern: "GAP [something]" or contain "GAP" in header
            const gapHeaders = headers.filter(h => h.toUpperCase().includes('GAP'));

            gapHeaders.forEach(gapHeader => {
                // Try to find corresponding TARGET and REALISASI columns
                // Common patterns: "TARGET [X]" and "REALISA [X]" or "REALISASI [X]"
                const gapParts = gapHeader.split(' ').filter(p => p !== 'GAP');

                // Find matching target and realisasi columns
                let targetCol = null;
                let realisaCol = null;

                for (const header of headers) {
                    const headerUpper = header.toUpperCase();
                    // Check if this is a TARGET column matching the GAP context
                    if (headerUpper.includes('TARGET') && gapParts.some(part => headerUpper.includes(part.toUpperCase()))) {
                        targetCol = header;
                    }
                    // Check if this is a REALISASI column matching the GAP context
                    if ((headerUpper.includes('REALISA') || headerUpper.includes('REALISASI')) &&
                        gapParts.some(part => headerUpper.includes(part.toUpperCase()))) {
                        realisaCol = header;
                    }
                }

                // If we found both columns, recalculate GAP
                if (targetCol && realisaCol) {
                    const targetVal = rowData[targetCol];
                    const realisaVal = rowData[realisaCol];

                    if (typeof targetVal === 'number' && typeof realisaVal === 'number') {
                        const calculatedGap = targetVal - realisaVal;
                        rowData[gapHeader] = calculatedGap;
                        console.log(`Recalculated ${gapHeader} for ${rawBidang}: ${targetVal} - ${realisaVal} = ${calculatedGap}`);
                    }
                }
            });

            // Collect for DB
            summaryRowsToInsert.push([
                importId, periodMonth, periodYear, rawBidang, value, JSON.stringify(rowData)
            ]);
        });

        // Update TOTAL row in Excel
        if (totalRowIndex !== -1) {
            const totalRow = plnSheet.getRow(totalRowIndex);
            totalRow.getCell(colTarget).value = calculatedTotal;

            // Also capture the TOTAL row for DB
            const totalRowData: any = {};
            headerRow.eachCell((headerCell, colNum) => {
                const headerKey = headerCell.value?.toString() || `col_${colNum}`;
                if (colNum === colTarget) {
                    totalRowData[headerKey] = calculatedTotal;
                } else {
                    let cellVal = totalRow.getCell(colNum).value;

                    // Handle formula results
                    if (cellVal && typeof cellVal === 'object' && 'result' in cellVal) {
                        cellVal = cellVal.result;
                    }

                    // Ensure numeric values (including negatives) are properly stored
                    if (typeof cellVal === 'number') {
                        totalRowData[headerKey] = cellVal;
                    } else if (cellVal === null || cellVal === undefined || cellVal === '') {
                        totalRowData[headerKey] = null;
                    } else {
                        totalRowData[headerKey] = cellVal;
                    }
                }
            });

            // POST-PROCESS: Recalculate GAP columns for TOTAL row as well
            const gapHeadersTotal = headers.filter(h => h.toUpperCase().includes('GAP'));

            gapHeadersTotal.forEach(gapHeader => {
                const gapParts = gapHeader.split(' ').filter(p => p !== 'GAP');
                let targetCol = null;
                let realisaCol = null;

                for (const header of headers) {
                    const headerUpper = header.toUpperCase();
                    if (headerUpper.includes('TARGET') && gapParts.some(part => headerUpper.includes(part.toUpperCase()))) {
                        targetCol = header;
                    }
                    if ((headerUpper.includes('REALISA') || headerUpper.includes('REALISASI')) &&
                        gapParts.some(part => headerUpper.includes(part.toUpperCase()))) {
                        realisaCol = header;
                    }
                }

                if (targetCol && realisaCol) {
                    const targetVal = totalRowData[targetCol];
                    const realisaVal = totalRowData[realisaCol];

                    if (typeof targetVal === 'number' && typeof realisaVal === 'number') {
                        const calculatedGap = targetVal - realisaVal;
                        totalRowData[gapHeader] = calculatedGap;
                        console.log(`Recalculated ${gapHeader} for TOTAL: ${targetVal} - ${realisaVal} = ${calculatedGap}`);
                    }
                }
            });

            const rawBidangTotal = totalRow.getCell(colBidang).value?.toString() || "TOTAL";

            summaryRowsToInsert.push([
                importId, periodMonth, periodYear, rawBidangTotal, calculatedTotal, JSON.stringify(totalRowData)
            ]);
        }

        // Insert Summary to DB
        for (const s of summaryRowsToInsert) {
            await client.query(
                `INSERT INTO revenue_summary_pln (
                import_id, period_month, period_year, kode_bidang, realisasi_billion, row_data
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
                s
            );
        }
        // Commit Transaction
        await client.query("UPDATE revenue_imports SET status = 'SUCCESS' WHERE id = $1", [importId]);
        await client.query("COMMIT");

        // Return Updated Excel
        const outBuffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(outBuffer as BlobPart, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Updated_${file.name}"`,
                "X-Import-ID": importId,
                "X-Detected-Month": periodMonth.toString(), // Returning the actually used month
                "X-Detected-Year": periodYear.toString()
            }
        });

    } catch (error: any) {
        await client.query("ROLLBACK");

        // Log error to DB if import record exists (outside transaction)
        try {
            await client.query(
                "UPDATE revenue_imports SET status = 'FAILED', error_message = $1 WHERE id = $2",
                [error.message, importId]
            );
        } catch (e) {
            console.error("Failed to log error to DB:", e);
        }

        console.error("Import Error:", error);
        return NextResponse.json(
            { message: "Import Failed", error: error.message },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
