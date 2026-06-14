const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    function printRange(start, end) {
        console.log(`\n--- Rows ${start} to ${end} ---`);
        for (let i = start; i <= end; i++) {
            if (range[i]) {
                console.log(`Row ${i}:`, range[i]);
            }
        }
    }
    
    printRange(55, 65);
    printRange(170, 185);
    printRange(580, 590);
    printRange(720, 735);
} catch (error) {
    console.error(error);
}
