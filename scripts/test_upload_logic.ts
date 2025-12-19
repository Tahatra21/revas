import { PrismaClient, UnitLevel, TargetType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import ExcelJS from "exceljs";
import path from "path";

// 1. Setup Adapter
const connectionString = "postgres://jmaharyuda@localhost:5432/revas_db";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const monthMap: Record<string, number> = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MEI": 5, "MAY": 5,
    "JUN": 6, "JUNI": 6, "JUL": 7, "JULI": 7, "AUG": 8, "AGU": 8, "AGUST": 8,
    "SEP": 9, "SEPT": 9, "SEPTEMBER": 9, "OKT": 10, "OCT": 10, "NOV": 11, "DES": 12, "DEC": 12
};

async function testUpload() {
    try {
        console.log("Connecting to DB via Adapter...");
        // Test connection
        await prisma.$connect();
        console.log("Connected.");

        console.log("Reading Book3.xlsx...");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(path.join(process.cwd(), "Book3.xlsx"));

        const sheet = workbook.getWorksheet(1);
        if (!sheet) throw new Error("Sheet 1 not found");

        console.log(`Sheet found: ${sheet.name}, Rows: ${sheet.rowCount}`);

        // 1. Identify Headers (Row 7)
        const headerRow = sheet.getRow(7);
        const colMap: any = {
            targetRkap: {},
            targetBeyond: {},
            actual: {}
        };

        headerRow.eachCell((cell, colNumber) => {
            const val = cell.value?.toString().toUpperCase() || "";
            const cleanVal = val.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

            // console.log(`Header Col ${colNumber}: "${cleanVal}"`);

            for (const [mName, mNum] of Object.entries(monthMap)) {
                if (cleanVal.includes(`TARGET ${mName} RKAP`) || cleanVal.includes(`TARGET ${mName}\nRKAP`)) {
                    colMap.targetRkap[mNum] = colNumber;
                }
                else if (cleanVal.includes(`TARGET ${mName} BEYOND`) || cleanVal.includes(`TARGET ${mName}BEYOND`)) {
                    colMap.targetBeyond[mNum] = colNumber;
                }
                else if (cleanVal.includes(`REALISASI ${mName}`) || cleanVal.includes(`REALISASI  ${mName}`)) {
                    colMap.actual[mNum] = colNumber;
                }
            }
        });

        console.log("Column Mapping:", JSON.stringify(colMap, null, 2));

        // 2. Process Data Rows (Row 8+)
        let processedCount = 0;
        const totalRows = sheet.rowCount;

        for (let r = 8; r <= totalRows; r++) {
            const row = sheet.getRow(r);
            const unitNameRaw = row.getCell(1).value?.toString() || row.getCell(2).value?.toString() || "";

            if (!unitNameRaw || unitNameRaw === "TOTAL" || unitNameRaw === "null" || unitNameRaw.trim() === "") continue;

            const unitCode = unitNameRaw.trim();
            console.log(`Processing Unit: ${unitCode} (Row ${r})`);

            const unit = await prisma.unit.upsert({
                where: { code: unitCode },
                update: {},
                create: { code: unitCode, name: unitCode, level: UnitLevel.SBU }
            });

            for (let m = 1; m <= 12; m++) {
                // Actuals
                if (colMap.actual[m]) {
                    const cell = row.getCell(colMap.actual[m]);
                    const val = cell.result ?? cell.value;
                    if (val !== null && val !== undefined && val !== "") {
                        await prisma.actual.upsert({
                            where: { year_month_unitId: { year: 2025, month: m, unitId: unit.id } },
                            update: { amount: Number(val) || 0 },
                            create: { year: 2025, month: m, unitId: unit.id, amount: Number(val) || 0 }
                        });
                    }
                }
                // Target RKAP
                if (colMap.targetRkap[m]) {
                    const cell = row.getCell(colMap.targetRkap[m]);
                    const val = cell.result ?? cell.value;
                    if (val) {
                        await prisma.target.upsert({
                            where: { year_month_unitId_targetType: { year: 2025, month: m, unitId: unit.id, targetType: TargetType.RKAP } },
                            update: { amount: Number(val) || 0 },
                            create: { year: 2025, month: m, unitId: unit.id, targetType: TargetType.RKAP, amount: Number(val) || 0 }
                        });
                    }
                }
            }
            processedCount++;
            if (processedCount >= 5) break; // Test only 5 rows
        }
        console.log("Test script finished successfully. Processed 5 rows.");

    } catch (e) {
        console.error("Test Script Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testUpload();
