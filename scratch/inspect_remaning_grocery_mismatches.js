const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Scanning for mismatches...");
    
    for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row || row.length === 0) continue;
        
        const col0 = String(row[0] || '').trim();
        const col5 = String(row[5] || '').trim();
        
        if (col0 && !col5) {
            // Check if this is a known main category header or if it looks like a product name
            const isCategoryHeader = i === 0 || i === 583 || i === 642; // Let's check these
            console.log(`\nRow ${i}: col0 = "${col0}", col5 is empty. (Category Header? ${isCategoryHeader})`);
            
            // Print surrounding rows
            for (let offset = -2; offset <= 3; offset++) {
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
