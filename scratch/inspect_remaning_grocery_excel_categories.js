const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Analyzing structure...");
    let currentCategory = null;
    let categoriesSeen = [];
    
    for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row || row.length === 0) continue;
        
        const col0 = String(row[0] || '').trim();
        const col5 = String(row[5] || '').trim();
        
        if (col0 && !col5) {
            // This might be a category header or section header
            console.log(`Row ${i}: Category candidate: "${col0}"`);
            categoriesSeen.push({ index: i, name: col0 });
        } else if (col0 && col5) {
            // This is a product
        }
    }
    
    console.log("Total Category candidates found:", categoriesSeen.length);
} catch (error) {
    console.error(error);
}
