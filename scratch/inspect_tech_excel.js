const XLSX = require('xlsx');

const filePath = 's:\\Aisle\\Excel\\Tech and acessories.xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Dumping rows 107 to 120:");
    for (let i = 107; i <= 120; i++) {
        console.log(`Row ${i}:`, JSON.stringify(rawRows[i]));
    }
} catch (e) {
    console.error("Error reading file:", e);
}
