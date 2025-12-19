const ExcelJS = require('exceljs');

async function inspectExcel() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/Users/jmaharyuda/Project/revas/Book3.xlsx');

    workbook.eachSheet((sheet, id) => {
        console.log(`Sheet ${id}: ${sheet.name}`);

        // Print Header Row 7
        const headerRow = sheet.getRow(7).values;
        console.log('Header Row 7:', JSON.stringify(headerRow));

        // Print Rows 8-20, focusing on Col 1 and 2
        for (let i = 8; i <= 20; i++) {
            const row = sheet.getRow(i);
            const col1 = row.getCell(1).value;
            const col2 = row.getCell(2).value;
            console.log(`Row ${i}: Col1="${col1}" | Col2="${col2}"`);
        }
    });
}

inspectExcel();
