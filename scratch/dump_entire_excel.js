const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Entire Excel Data:");
    for (let r = 0; r < range.length; r++) {
        const row = range[r];
        const val0 = row[0] !== undefined ? String(row[0]).trim() : "";
        const val3 = row[3] !== undefined ? String(row[3]).trim() : "";
        if (val0 || val3) {
            console.log(`Row ${r}: Col 0 = "${val0}" | Col 3 = "${val3}"`);
        }
    }
} catch (error) {
    console.error("Failed to read Excel:", error);
}
