const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const row0 = range[0];
    console.log("Row 0 headers:");
    for (let c = 0; c < row0.length; c++) {
        if (row0[c] !== undefined && row0[c] !== "") {
            console.log(`Col ${c}: "${row0[c]}"`);
        }
    }
    
    // Let's also scan other rows to find if headers are placed differently or if other columns have data.
    const populatedCols = new Set();
    range.forEach(row => {
        row.forEach((cell, c) => {
            if (cell !== undefined && cell !== "") {
                populatedCols.add(c);
            }
        });
    });
    console.log("All columns containing data in any row:", Array.from(populatedCols).sort((a,b)=>a-b));
} catch (error) {
    console.error("Failed to read Excel:", error);
}
