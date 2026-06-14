const xlsx = require('xlsx');
const path = require('path');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log("Sheet Names:", sheetNames);
    
    for (const name of sheetNames) {
        console.log(`\n--- Sheet: ${name} ---`);
        const sheet = workbook.Sheets[name];
        const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
        console.log(`Row Count: ${data.length}`);
        if (data.length > 0) {
            console.log("Sample Row:", JSON.stringify(data[0], null, 2));
            console.log("Columns:", Object.keys(data[0]));
        }
    }
} catch (error) {
    console.error("Failed to read Excel:", error);
}
