const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const allowedCategories = [
        "General Provision / Kirana",
        "Fruits & Vegetables",
        "Dairy & Ice Cream",
        "Bakery & Cake Shop",
        "Sweet Shop (Mithai & Farsan)",
        "Dry Fruits & Spices",
        "Wholesale / Grain Mart",
        "Organic / Gourmet",
        "Other"
    ];
    
    console.log("Analyzing category matches...");
    
    for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row || row.length === 0) continue;
        
        const col0 = String(row[0] || '').trim();
        if (col0) {
            // Check if col0 matches any allowed category (case-insensitive, clean spaces)
            const matched = allowedCategories.find(cat => 
                cat.toLowerCase().replace(/[^a-z]/g, '') === col0.toLowerCase().replace(/[^a-z]/g, '')
            );
            if (matched) {
                console.log(`Row ${i}: MATCHED Category Header: "${col0}" -> mapped to "${matched}"`);
            }
        }
    }
} catch (error) {
    console.error(error);
}
