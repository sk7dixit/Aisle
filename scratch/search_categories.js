const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Searching for keywords...");
    for (let r = 0; r < range.length; r++) {
        const row = range[r];
        for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || '').trim();
            if (cellVal.toLowerCase().includes('cracker') || 
                cellVal.toLowerCase().includes('firework') || 
                cellVal.toLowerCase().includes('winter') || 
                cellVal.toLowerCase().includes('rain') ||
                cellVal.toLowerCase().includes('gear')) {
                console.log(`Match at Row ${r}, Col ${c}: "${cellVal}"`);
            }
        }
    }
} catch (error) {
    console.error("Failed to read Excel:", error);
}
