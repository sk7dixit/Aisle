const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Searching for Capsicum...");
    for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row || row.length === 0) continue;
        
        const col0 = String(row[0] || '').trim();
        if (col0.toLowerCase().includes('capsicum')) {
            console.log(`Row ${i}:`, row);
            // Print 10 rows before and after
            console.log("--- Surrounding rows ---");
            for (let j = Math.max(0, i - 15); j <= Math.min(range.length - 1, i + 10); j++) {
                console.log(`  Row ${j}:`, range[j]);
            }
        }
    }
} catch (error) {
    console.error(error);
}
