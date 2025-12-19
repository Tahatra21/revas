import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    try {
        const result = await query(
            `SELECT 
                t.*, 
                s.code as sbu_code, 
                s.name as sbu_name 
             FROM revenue_target_yearly t
             JOIN master_sbu s ON t.sbu_id = s.id
             WHERE t.year = $1
             ORDER BY s.code`,
            [year]
        );

        // Group by SBU
        const targets: any = {};
        result.forEach((row: any) => {
            if (!targets[row.sbu_code]) {
                targets[row.sbu_code] = {
                    sbuCode: row.sbu_code,
                    sbuName: row.sbu_name,
                    targetRkap: 0,
                    targetKomitmen: 0,
                    targetBeyond: 0,
                    co: 0,
                    nr: 0
                };
            }
            if (row.kategori === 'RKAP') targets[row.sbu_code].targetRkap = Number(row.target_amount);
            if (row.kategori === 'COMMITMENT') targets[row.sbu_code].targetKomitmen = Number(row.target_amount);
            if (row.kategori === 'BEYOND') targets[row.sbu_code].targetBeyond = Number(row.target_amount);
            if (row.kategori === 'CO') targets[row.sbu_code].co = Number(row.target_amount);
            if (row.kategori === 'NR') targets[row.sbu_code].nr = Number(row.target_amount);
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`Targets ${year}`);

        sheet.columns = [
            { header: 'SBU Code', key: 'sbuCode', width: 15 },
            { header: 'SBU Name', key: 'sbuName', width: 30 },
            { header: 'Target RKAP', key: 'targetRkap', width: 20 },
            { header: 'Target Komitmen', key: 'targetKomitmen', width: 20 },
            { header: 'Target Beyond', key: 'targetBeyond', width: 20 },
            { header: 'CO', key: 'co', width: 15 },
            { header: 'NR', key: 'nr', width: 15 },
        ];

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const rows = Object.values(targets);
        if (rows.length === 0) {
            // Add template row if empty
            sheet.addRow({ sbuCode: 'EXAMPLE', sbuName: 'Example SBU', targetRkap: 0, targetKomitmen: 0, targetBeyond: 0, co: 0, nr: 0 });
        } else {
            rows.forEach((r: any) => sheet.addRow(r));
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Revenue_Targets_${year}.xlsx"`
            }
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export" }, { status: 500 });
    }
}
