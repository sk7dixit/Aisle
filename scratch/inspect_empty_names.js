const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Checking rows with no product name but containing a link...");
    
    for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row || row.length === 0) continue;
        
        const col0 = String(row[0] || '').trim();
        const col5 = String(row[5] || '').trim();
        
        if (!col0 && col5) {
            console.log(`Row ${i}: col0 is empty, col5 = "${col5}"`);
            // Print surrounding rows
            for (let offset = -2; offset <= 2; offset++) {
                const idx = i + offset;
                if (idx >= 0 && idx < range.length) {
                    console.log(`  Row ${idx}:`, range[idx]);
                }
            }
        }
    }
} catch (error) {
    console.error(error);
}
