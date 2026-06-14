const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    // Let's read it as a 2D array (matrix) of cells to see raw values including headers
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log("Total rows in range:", range.length);
    
    // Print first 5 rows
    for (let r = 0; r < Math.min(range.length, 5); r++) {
        console.log(`\nRow ${r}:`);
        const row = range[r];
        for (let c = 0; c < row.length; c++) {
            if (row[c] !== undefined && row[c] !== "") {
                console.log(`  Col ${c}: "${row[c]}"`);
            }
        }
    }
} catch (error) {
    console.error("Failed to read Excel:", error);
}
