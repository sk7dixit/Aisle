const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Searching for exact category headers in col 0...");
    for (let r = 0; r < range.length; r++) {
        const row = range[r];
        const val0 = String(row[0] || '').trim();
        if (val0.toLowerCase() === 'festival specific' ||
            val0.toLowerCase() === 'crackers & fireworks' ||
            val0.toLowerCase() === 'winter / rain gear') {
            console.log(`Found header at Row ${r}: "${val0}"`);
        }
    }
} catch (error) {
    console.error("Failed to read Excel:", error);
}
