const xlsx = require('xlsx');
const url = require('url');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const domains = new Set();
    for (let r = 0; r < range.length; r++) {
        const row = range[r];
        if (!row || row.length === 0) continue;
        const val3 = String(row[3] || '').trim();
        if (val3 && val3.startsWith('http')) {
            try {
                const parsed = new URL(val3);
                domains.add(parsed.hostname);
            } catch (e) {}
        }
    }
    
    console.log("Unique domains in Excel:");
    Array.from(domains).forEach(d => console.log(`- ${d}`));
} catch (error) {
    console.error("Failed to read Excel:", error);
}
