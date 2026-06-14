const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Scanning all rows for non-empty columns...");
    for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row || row.length === 0) continue;
        
        // Find any non-empty cell in the row
        const nonValCells = [];
        row.forEach((cell, colIdx) => {
            if (cell !== undefined && String(cell).trim() !== "") {
                nonValCells.push({ colIdx, value: String(cell).trim() });
            }
        });
        
        if (nonValCells.length > 0) {
            // Check if it's a category/section header by checking if there is no URL (no cell starts with http or has www)
            const hasUrl = nonValCells.some(c => c.value.startsWith('http') || c.value.includes('www'));
            if (!hasUrl) {
                console.log(`Row ${i}:`, nonValCells);
            }
        }
    }
} catch (error) {
    console.error(error);
}
