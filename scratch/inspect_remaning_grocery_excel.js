const xlsx = require('xlsx');
const path = require('path');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    console.log("Sheet names:", workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log(`Total rows in sheet ${sheetName}: ${range.length}`);
        
        // Print the first 10 rows
        for (let i = 0; i < Math.min(range.length, 15); i++) {
            console.log(`Row ${i}:`, range[i]);
        }
    });
} catch (error) {
    console.error("Failed to read Excel:", error);
}
