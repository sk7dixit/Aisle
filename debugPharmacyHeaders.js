const XLSX = require('xlsx');
const workbook = XLSX.readFile('s:\\2K27_Project\\Pharmacy or Medical Store.xlsx');

['Sheet1', 'Sheet2'].forEach(sheetName => {
    console.log(`\n--- ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Print first 5 rows
    for (let i = 0; i < Math.min(json.length, 5); i++) {
        console.log(`Row ${i}:`, JSON.stringify(json[i]));
    }
});
