const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("All products from Excel:");
    for (let r = 0; r < range.length; r++) {
        const row = range[r];
        if (!row || row.length === 0) continue;
        const val0 = String(row[0] || '').trim();
        const val3 = String(row[3] || '').trim();
        if (val0 && val3) {
            console.log(`Row ${r}: "${val0}" -> "${val3}"`);
        }
    }
} catch (error) {
    console.error("Failed to read Excel:", error);
}
