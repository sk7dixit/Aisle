const XLSX = require('xlsx');

const filePath = 's:\\Aisle\\Excel\\elctrical.xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Dumping all rows from elctrical.xlsx:");
    rawRows.forEach((row, idx) => {
        console.log(`Row ${idx}:`, JSON.stringify(row));
    });
} catch (e) {
    console.error("Error reading file:", e);
}
