const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const domains = {};
    for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row || row.length === 0) continue;
        
        const col5 = String(row[5] || '').trim();
        if (col5 && col5.startsWith('http')) {
            try {
                const url = new URL(col5);
                const host = url.hostname.replace('www.', '');
                domains[host] = (domains[host] || 0) + 1;
            } catch (e) {}
        }
    }
    
    const sorted = Object.entries(domains).sort((a,b) => b[1] - a[1]);
    console.log("Unique domains in Excel and their counts:");
    sorted.forEach(([domain, count]) => {
        console.log(`- ${domain}: ${count}`);
    });
} catch (error) {
    console.error(error);
}
