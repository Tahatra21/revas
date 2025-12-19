import { NextRequest, NextResponse } from "next/server";
import { UnitLevel, TargetType } from "@prisma/client";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

// Helper to map month name to number
const monthMap: Record<string, number> = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MEI": 5, "MAY": 5,
    "JUN": 6, "JUNI": 6, "JUL": 7, "JULI": 7, "AUG": 8, "AGU": 8, "AGUST": 8,
    "SEP": 9, "SEPT": 9, "SEPTEMBER": 9, "OKT": 10, "OCT": 10, "NOV": 11, "DES": 12, "DEC": 12
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const year = 2025; // Default to 2025 as per file name/headers

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.getWorksheet(1); // Assume Sheet 1
        if (!sheet) {
            return NextResponse.json({ message: "Sheet 1 not found" }, { status: 400 });
        }

        // 1. Identify Headers (Row 7)
        const headerRow = sheet.getRow(7);
        const colMap: any = {
            targetRkap: {},
            targetBeyond: {},
            targetCommitment: {},
            targetNr: {},
            actual: {}
        };

        console.log("Analyzing Headers...");
        headerRow.eachCell((cell, colNumber) => {
            const val = cell.value?.toString().toUpperCase() || "";
            // regex to find patterns
            const cleanVal = val.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

            // Console log for debug
            // console.log(`Col ${colNumber}: ${cleanVal}`);

            for (const [mName, mNum] of Object.entries(monthMap)) {
                // Check specific patterns
                // RKAP
                if (cleanVal.includes(`TARGET ${mName} RKAP`) || cleanVal.includes(`TARGET ${mName}\nRKAP`) || (mName === 'OCT' && cleanVal === 'TARGET OCT')) {
                    colMap.targetRkap[mNum] = colNumber;
                }
                // BEYOND
                else if (cleanVal.includes(`TARGET ${mName} BEYOND`) || cleanVal.includes(`TARGET ${mName}BEYOND`)) {
                    colMap.targetBeyond[mNum] = colNumber;
                }
                // COMMITMENT (CO)
                else if (cleanVal.includes(`CO ${mName}`) || cleanVal.includes(`CO  ${mName}`)) {
                    colMap.targetCommitment[mNum] = colNumber;
                }
                // NR (Non-Retail / Non-Rekening?) - Added Parsing Logic
                else if (cleanVal.includes(`NR ${mName}`) || cleanVal.includes(`NR  ${mName}`)) {
                    // Exclude "NR sd NOV" if possible, or accept overwrites.
                    if (!cleanVal.includes('NR SD ')) {
                        colMap.targetNr[mNum] = colNumber;
                    }
                }
                // ACTUAL
                else if (cleanVal.includes(`REALISASI ${mName}`) || cleanVal.includes(`REALISASI  ${mName}`)) {
                    colMap.actual[mNum] = colNumber;
                }
                // Special cases for typos or variations seen in inspect log
                // e.g. "% JAN\n RKAP" -> Not target
                // "TARGET JAN BEYOND RKAP" -> OK
            }
        });

        console.log("Column Mapping Result:", JSON.stringify(colMap, null, 2));

        // 2. Process Data Rows (Row 8+)
        let processedCount = 0;
        const totalRows = sheet.rowCount;
        console.log(`Processing ${totalRows} rows...`);

        for (let r = 8; r <= totalRows; r++) {
            const row = sheet.getRow(r);
            const unitNameRaw = row.getCell(1).value?.toString() || row.getCell(2).value?.toString() || ""; // Check col 1 and 2

            // Skip invalid or total rows
            if (!unitNameRaw || unitNameRaw === "TOTAL" || unitNameRaw === "null" || unitNameRaw.trim() === "") continue;

            // Clean Unit Name
            const unitCode = unitNameRaw.trim();
            const unitName = unitCode;

            // Upsert Unit
            try {
                const unit = await prisma.unit.upsert({
                    where: { code: unitCode },
                    update: {},
                    create: {
                        code: unitCode,
                        name: unitName,
                        level: UnitLevel.SBU
                    }
                });

                // Process Months
                for (let m = 1; m <= 12; m++) {
                    const processMetric = async (map: any, type: 'RKAP' | 'BEYOND' | 'COMMITMENT' | 'NR' | 'ACTUAL') => {
                        const colIdx = map[m];
                        if (colIdx) {
                            const cell = row.getCell(colIdx);
                            const val = cell.result ?? cell.value; // Handle formulae
                            const amount = Number(val) || 0;

                            if (type === 'ACTUAL') {
                                // Only process valid actuals (allow 0 if explicit, but skip if null/empty string meaning 'not happened yet')
                                // ExcelJS often returns object for formula, or null for empty.
                                if (val !== null && val !== undefined && val !== "") {
                                    await prisma.actual.upsert({
                                        where: { year_month_unitId: { year, month: m, unitId: unit.id } },
                                        update: { amount },
                                        create: { year, month: m, unitId: unit.id, amount }
                                    });
                                }
                            } else {
                                // Targets & Commitment & NR
                                if (amount > 0) {
                                    let tType = TargetType.RKAP;
                                    if (type === 'BEYOND') tType = TargetType.BEYOND_RKAP;
                                    if (type === 'COMMITMENT') tType = TargetType.COMMITMENT;
                                    if (type === 'NR') tType = TargetType.NR; // Added Type

                                    await prisma.target.upsert({
                                        where: { year_month_unitId_targetType: { year, month: m, unitId: unit.id, targetType: tType } },
                                        update: { amount },
                                        create: { year, month: m, unitId: unit.id, targetType: tType, amount }
                                    });
                                }
                            }
                        }
                    };

                    await processMetric(colMap.targetRkap, 'RKAP');
                    await processMetric(colMap.targetBeyond, 'BEYOND');
                    await processMetric(colMap.targetCommitment, 'COMMITMENT');
                    await processMetric(colMap.targetNr, 'NR'); // Process NR
                    await processMetric(colMap.actual, 'ACTUAL');
                }
                processedCount++;
            } catch (err: any) {
                console.error(`Error processing row ${r} (${unitName}):`, err.message);
            }
        }

        console.log(`Processed ${processedCount} units successfully.`);
        return NextResponse.json({ success: true, count: processedCount });

    } catch (error: any) {
        console.error("Upload Fatal Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
