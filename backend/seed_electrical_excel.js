const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const xlsx = require('xlsx');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const MasterCatalogProduct = require('./models/MasterCatalogProduct');

// EAN-13 check digit calculator
const generateBarcode = (baseNum) => {
    const str = baseNum.toString();
    let sumEven = 0;
    let sumOdd = 0;
    
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(str[i]);
        if (i % 2 === 1) {
            sumEven += digit;
        } else {
            sumOdd += digit;
        }
    }
    
    const total = sumOdd + (sumEven * 3);
    const remainder = total % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    
    return str + checkDigit.toString();
};

const normalizeName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, ' ');
};

const resolveImageUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        const match = url.match(/\/file\/d\/([^\/\?]+)/) || url.match(/[?&]id=([^&]+)/);
        if (match) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
    }
    if (url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes('googleusercontent.com')) {
        return url;
    }
    return '';
};

async function run() {
    try {
        console.log('Connecting to Database...');
        await connectDB();
        console.log('Database connected successfully!');

        // Delete all electrical_hardware_auto products (including the 6 unwanted grocery products)
        console.log('Cleaning old MasterCatalogProduct entries for electrical_hardware_auto...');
        const cleanRes = await MasterCatalogProduct.deleteMany({ shopType: 'electrical_hardware_auto' });
        console.log(`Removed ${cleanRes.deletedCount} old catalog products.`);

        // Read the Excel sheet
        const filePath = 's:/Aisle/Excel/elctrical.xlsx';
        if (!fs.existsSync(filePath)) {
            console.error(`Error: Excel file not found at ${filePath}`);
            process.exit(1);
        }

        console.log('Reading Excel file...');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`Loaded ${rawRows.length} rows from Excel sheet.`);

        const sheetHeaderToCategory = {
            'electrical & lighting': 'Electrical Shop',
            'electrical items': 'Electrical Shop',
            'tools & industrial supply': 'Industrial / Power Tools',
            'industrial / power tools': 'Industrial / Power Tools'
        };

        const knownBrands = ['anchor', 'havells', 'gm', 'legrand', 'schneider', 'polycab', 'finolex', 'rr', 'kei', 'philips', 'wipro', 'syska', 'crompton', 'orient', 'bajaj', 'usha', 'atomberg'];

        let currentCategory = 'Electrical Shop';
        const productsToInsert = [];

        let barcodeCounter = 890500000000;

        rawRows.forEach((row, rowIdx) => {
            if (!row || row.length === 0) return;

            // Check if this row is a category header
            const nonOptCells = row.map((val, idx) => ({ val: String(val || '').trim(), idx })).filter(c => c.val !== '');
            const isHeader = nonOptCells.length === 1 && !row[0];
            
            if (isHeader) {
                const valStr = nonOptCells[0].val;
                const valLower = valStr.toLowerCase();
                if (sheetHeaderToCategory[valLower]) {
                    currentCategory = sheetHeaderToCategory[valLower];
                } else if (valLower.includes('electrical')) {
                    currentCategory = 'Electrical Shop';
                } else if (valLower.includes('tool') || valLower.includes('industrial')) {
                    currentCategory = 'Industrial / Power Tools';
                }
                console.log(`[Parser] Category switched to "${currentCategory}" at row ${rowIdx}`);
                return;
            }

            const pName = row[0] ? String(row[0]).trim() : '';
            if (!pName || pName.toLowerCase().includes('product name') || pName.toLowerCase().includes('common brand')) return;

            let pBrand = 'General';
            const firstWord = pName.trim().split(/\s+/)[0];
            if (firstWord && knownBrands.includes(firstWord.toLowerCase())) {
                pBrand = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
            }

            const rawUrl = row[4] ? String(row[4]).trim() : '';
            const resolvedImage = resolveImageUrl(rawUrl) || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500'; // Default electrical/industrial image fallback

            const barcode = generateBarcode(barcodeCounter++);
            const normName = normalizeName(pName);

            productsToInsert.push({
                name: pName,
                normalizedName: normName,
                brand: pBrand,
                category: currentCategory,
                shopType: 'electrical_hardware_auto',
                imageUrl: resolvedImage,
                barcode: barcode,
                source: 'excel_electrical',
                externalId: `electrical_excel_${rowIdx}`,
                verified: true,
                catalogStatus: 'verified'
            });
        });

        console.log(`Parsed ${productsToInsert.length} products to insert.`);
        
        let insertedCount = 0;
        for (const prod of productsToInsert) {
            await MasterCatalogProduct.create(prod);
            insertedCount++;
        }

        console.log(`Successfully seeded ${insertedCount} electrical and tools products into MongoDB.`);
        process.exit(0);
    } catch (err) {
        console.error('Critical seeding error:', err);
        process.exit(1);
    }
}

run();
