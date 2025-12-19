const { PrismaClient, UnitLevel, TargetType } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL is missing!");
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const monthMap = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MEI": 5, "MAY": 5,
    "JUN": 6, "JUNI": 6, "JUL": 7, "JULI": 7, "AUG": 8, "AGU": 8, "AGUST": 8,
    "SEP": 9, "SEPT": 9, "SEPTEMBER": 9, "OKT": 10, "OCT": 10, "NOV": 11, "DES": 12, "DEC": 12
};

async function main() {
    // 0. Fetch SBUs for mapping
    const sbus = await prisma.master_sbu.findMany();
    const sbuMap = new Map(sbus.map(s => [s.code, s]));
    console.log(`Loaded ${sbus.length} SBUs for mapping.`);

    const filePath = path.join(process.cwd(), "Book3.xlsx");
    console.log(`Loading file from: ${filePath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
        throw new Error("Sheet 1 not found");
    }

    // 1. Identify Headers (Row 7)
    const headerRow = sheet.getRow(7);
    const colMap = {
        targetRkap: {},
        targetBeyond: {},
        targetCommitment: {},
        targetNr: {},
        actual: {}
    };

    console.log("Analyzing Headers...");
    headerRow.eachCell((cell, colNumber) => {
        const val = cell.value?.toString().toUpperCase() || "";
        const cleanVal = val.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

        for (const [mName, mNum] of Object.entries(monthMap)) {
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
            // NR
            else if (cleanVal.includes(`NR ${mName}`) || cleanVal.includes(`NR  ${mName}`)) {
                if (!cleanVal.includes('NR SD ')) {
                    colMap.targetNr[mNum] = colNumber;
                }
            }
            // ACTUAL
            else if (cleanVal.includes(`REALISASI ${mName}`) || cleanVal.includes(`REALISASI  ${mName}`)) {
                colMap.actual[mNum] = colNumber;
            }
        }
    });

    console.log("Column Map:", JSON.stringify(colMap, null, 2));

    let processedCount = 0;
    const totalRows = sheet.rowCount;
    const year = 2025;

    for (let r = 8; r <= totalRows; r++) {
        const row = sheet.getRow(r);
        const unitNameRaw = row.getCell(1).value?.toString() || row.getCell(2).value?.toString() || "";

        if (unitNameRaw && unitNameRaw.includes("KONFRA")) {
            console.log("DEBUG KONFRA ROW:", unitNameRaw);
            row.eachCell((cell, colNumber) => {
                if (cell.value) console.log(`Col ${colNumber}: ${cell.value}`);
            });
        }

        if (!unitNameRaw || unitNameRaw === "TOTAL" || unitNameRaw === "null" || unitNameRaw.trim() === "") continue;

        const unitCode = unitNameRaw.trim();

        // SBU Mapping Logic
        // "KONFRA - JUSOL" -> "KONFRA"
        const potentialSbuCode = unitCode.split(' - ')[0].trim();
        const sbuInfo = sbuMap.get(potentialSbuCode) || sbuMap.get(unitCode); // Try split, then exact

        let unitName = unitCode;
        let sbuId = null;

        if (sbuInfo) {
            unitName = sbuInfo.name; // Use SBU Name
            sbuId = sbuInfo.id;
        } else {
            // Fallback or log?
            // console.warn(`No SBU found for ${unitCode}`);
        }

        try {
            const unit = await prisma.unit.upsert({
                where: { code: unitCode },
                update: {
                    name: unitName,
                    sbuId: sbuId
                },
                create: {
                    code: unitCode,
                    name: unitName,
                    level: UnitLevel.SBU,
                    sbuId: sbuId
                }
            });

            for (let m = 1; m <= 12; m++) {
                const processMetric = async (map, type) => {
                    const colIdx = map[m];
                    if (colIdx) {
                        const cell = row.getCell(colIdx);
                        const val = cell.result ?? cell.value;
                        const amount = Number(val) || 0;

                        if (type === 'ACTUAL') {
                            if (val !== null && val !== undefined && val !== "") {
                                await prisma.actual.upsert({
                                    where: { year_month_unitId: { year, month: m, unitId: unit.id } },
                                    update: { amount },
                                    create: { year, month: m, unitId: unit.id, amount }
                                });
                            }
                        } else {
                            if (amount > 0) {
                                let tType = TargetType.RKAP;
                                if (type === 'BEYOND') tType = TargetType.BEYOND_RKAP;
                                if (type === 'COMMITMENT') tType = TargetType.COMMITMENT;
                                if (type === 'NR') tType = TargetType.NR;

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
                await processMetric(colMap.targetNr, 'NR');
                await processMetric(colMap.actual, 'ACTUAL');
            }
            processedCount++;
            process.stdout.write('.');
        } catch (err) {
            console.error(`Error ${unitCode}:`);
            console.error(err);
        }
    }
    console.log(`\nImport Done. Processed ${processedCount} units.`);
}

main()
    .catch(e => {
        console.error("Script Fatal Error:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
