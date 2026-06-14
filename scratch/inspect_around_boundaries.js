const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const printRange = (start, end) => {
        console.log(`\n--- Rows ${start} to ${end} ---`);
        for (let r = start; r <= end; r++) {
            if (r < range.length) {
                console.log(`Row ${r}: ${JSON.stringify(range[r])}`);
            }
        }
    };
    
    printRange(0, 3);
    printRange(99, 105);
    printRange(156, 162);
} catch (error) {
    console.error("Failed to read Excel:", error);
}
