import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import ExcelJS from "exceljs";

const SBU_ORDER = ['KONFRA', 'APLIKASI', 'JKB', 'JBB', 'JTG', 'JBT', 'BNR', 'SBU', 'SBT', 'SBS', 'SLW', 'KLM'];

export async function GET() {
    try {
        // Fetch all active SBUs
        const sbus = await query(`
            SELECT code, name 
            FROM master_sbu 
            WHERE is_active = TRUE 
            ORDER BY code
        `);

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Targets');

        // Define columns
        worksheet.columns = [
            { header: 'SBU Code', key: 'code', width: 15 },
            { header: 'SBU Name', key: 'name', width: 30 },
            { header: 'Target RKAP (Billion IDR)', key: 'targetRkap', width: 25 },
            { header: 'CO Tahun Berjalan (Billion IDR)', key: 'coTahunBerjalan', width: 30 },
            { header: 'Target NR (Billion IDR)', key: 'targetNr', width: 25 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Sort SBUs by predefined order
        const sortedSbus = SBU_ORDER.map(code =>
            sbus.find(s => s.code === code)
        ).filter(Boolean);

        // Add data rows (SBU codes and names pre-filled, targets empty)
        sortedSbus.forEach((sbu: any) => {
            worksheet.addRow({
                code: sbu.code,
                name: sbu.name,
                targetRkap: '',
                coTahunBerjalan: '',
                targetNr: ''
            });
        });

        // Add instruction row at the top (before header)
        worksheet.insertRow(1, ['INSTRUCTIONS: Fill in the target values (in Billion IDR) for each SBU. Leave empty for 0.']);
        worksheet.mergeCells('A1:E1');
        worksheet.getRow(1).font = { italic: true, color: { argb: 'FF808080' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE699' }
        };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Return as downloadable file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Revenue_Target_Template_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });
    } catch (error) {
        console.error("Error generating template:", error);
        return NextResponse.json(
            { message: "Failed to generate template" },
            { status: 500 }
        );
    }
}
