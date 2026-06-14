const xlsx = require('xlsx');

const filePath = 's:/Aisle/Excel/Festive.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const targets = ['Holi Gulal Red', 'Holi Gulal Yellow', 'Holi Gulal Green', 'Pichkari Small', 'Pichkari Large', 'Pichkari Gun', 'Pooja Thali', 'Diya', 'Rangoli'];
    
    console.log("Details from Excel:");
    for (let r = 0; r < range.length; r++) {
        const row = range[r];
        const val0 = String(row[0] || '').trim();
        const val3 = String(row[3] || '').trim();
        
        if (targets.some(t => val0.toLowerCase().includes(t.toLowerCase()))) {
            console.log(`Row ${r}: Name = "${val0}" | Link = "${val3}"`);
        }
    }
} catch (error) {
    console.error("Failed to read Excel:", error);
}
