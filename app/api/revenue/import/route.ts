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

export async function POST(req: NextRequest) {
    const client = await getClient();
    const importId = uuidv4();

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const periodMonth = parseInt(formData.get("period_month") as string);
        const periodYear = parseInt(formData.get("period_year") as string);
        const uploadedBy = (formData.get("uploaded_by") as string) || "System";

        if (!file || !periodMonth || !periodYear) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        if (periodMonth < 1 || periodMonth > 12) {
            return NextResponse.json({ message: "Invalid month (1-12)" }, { status: 400 });
        }

        // Start Transaction
        await client.query("BEGIN");

        // 1. Create Import Record
        await client.query(
            `INSERT INTO revenue_imports (
        id, source_filename, period_month, period_year, uploaded_by, status
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
            [importId, file.name, periodMonth, periodYear, uploadedBy]
        );

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

        // 4. Process Sheet 2: REVENUE PLN
        const plnSheet = workbook.getWorksheet("REVENUE PLN");
        if (!plnSheet) {
            console.error("Sheet 'REVENUE PLN' not found. Available sheets:", workbook.worksheets.map(s => s.name));
            throw new Error("Sheet 'REVENUE PLN' not found");
        }

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
            headerRow.eachCell((cell, colNumber) => {
                const val = cell.value?.toString() || "";
                if (potentialHeaders.some(h => val.toLowerCase().includes(h.toLowerCase()))) {
                    colTarget = colNumber;
                    console.log(`Found Target Column '${val}' at col ${colNumber} (Retry)`);
                }
            });
        }

        if (colTarget === -1) {
            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            const expected = months[periodMonth - 1];
            throw new Error(`Column for '${expected}' (e.g., 'Realisasi ${expected}') not found in 'REVENUE PLN'. Check if selected Month matches file headers.`);
        }

        // Update Import record with target column name
        const targetColName = plnSheet.getRow(plnHeaderRowIdx).getCell(colTarget).value?.toString();
        await client.query(
            "UPDATE revenue_imports SET target_realisasi_column = $1 WHERE id = $2",
            [targetColName, importId]
        );

        let calculatedTotal = 0;
        const summaryRowsToInsert: any[] = [];
        let totalRowIndex = -1;

        // Iterate PLN rows
        plnSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= plnHeaderRowIdx) return;

            const rawBidang = row.getCell(colBidang).value?.toString() || "";
            if (!rawBidang) return;

            // Check if TOTAL row
            if (rawBidang.toUpperCase().includes("TOTAL")) {
                totalRowIndex = rowNumber;
                return;
            }

            // Mapping Logic: "AAA - BBB" -> "AAA"
            // If not containing " - ", use as is
            let sbuKey = "";
            if (rawBidang.includes("-")) {
                sbuKey = rawBidang.split("-")[0].trim();
            } else {
                sbuKey = rawBidang.trim();
            }

            // Uppercase for map lookup? "SBU CODE" in sheet 1 was normalized
            // Usually codes like "JBT", "JBY", etc.
            // Assuming map keys are "AAA", "BBB".
            // Let's normalize sbuKey same as map key
            const normalizedKey = normalizeCode(sbuKey);

            const value = sbuMap.get(normalizedKey) || 0; // In Billions

            // Update Cell
            row.getCell(colTarget).value = value;
            calculatedTotal += value;

            // Collect for DB
            summaryRowsToInsert.push([
                importId, periodMonth, periodYear, rawBidang, value
            ]);
        });

        // Update TOTAL row
        if (totalRowIndex !== -1) {
            plnSheet.getRow(totalRowIndex).getCell(colTarget).value = calculatedTotal;
        }

        // Insert Summary to DB
        for (const s of summaryRowsToInsert) {
            await client.query(
                `INSERT INTO revenue_summary_pln (
                import_id, period_month, period_year, kode_bidang, realisasi_billion
            ) VALUES ($1, $2, $3, $4, $5)`,
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
                "X-Import-ID": importId
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
