const XLSX = require('xlsx');

const filePath = 's:\\Aisle\\Excel\\Tech and acessories.xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let driveCount = 0;
    let shareCount = 0;
    let otherUrlCount = 0;
    let emptyCount = 0;
    
    rawRows.forEach((row, idx) => {
        if (!row || row.length === 0) return;
        
        // Skip potential headers
        const nonOptCells = row.map((val, colIdx) => ({ val: String(val || '').trim(), colIdx })).filter(c => c.val !== '');
        if (nonOptCells.length === 1) return;
        
        // Find URL in cells
        let urlCell = '';
        row.forEach(cell => {
            if (cell && String(cell).startsWith('http')) {
                urlCell = String(cell).trim();
            }
        });
        
        if (!urlCell) {
            emptyCount++;
        } else if (urlCell.includes('drive.google.com')) {
            driveCount++;
        } else if (urlCell.includes('share.google')) {
            shareCount++;
        } else {
            otherUrlCount++;
            console.log(`Other URL found at row ${idx}:`, urlCell);
        }
    });
    
    console.log("Link Statistics:");
    console.log("- drive.google.com:", driveCount);
    console.log("- share.google:", shareCount);
    console.log("- Other URLs:", otherUrlCount);
    console.log("- No URL:", emptyCount);
} catch (e) {
    console.error("Error reading file:", e);
}
