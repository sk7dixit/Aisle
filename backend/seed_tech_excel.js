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
    const urlStr = String(url).trim();
    if (urlStr.includes('drive.google.com')) {
        const match = urlStr.match(/\/file\/d\/([^\/\?]+)/) || urlStr.match(/[?&]id=([^&]+)/);
        if (match) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
    }
    if (urlStr.match(/\.(jpeg|jpg|gif|png|webp)/i) || urlStr.includes('googleusercontent.com')) {
        return urlStr;
    }
    return '';
};

async function run() {
    try {
        console.log('Connecting to Database...');
        await connectDB();
        console.log('Database connected successfully!');

        // Delete all old tech_accessories products
        console.log('Cleaning old MasterCatalogProduct entries for tech_accessories...');
        const cleanRes = await MasterCatalogProduct.deleteMany({ shopType: 'tech_accessories' });
        console.log(`Removed ${cleanRes.deletedCount} old catalog products.`);

        // Read the Excel sheet
        const filePath = 's:/Aisle/Excel/Tech and acessories.xlsx';
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
            'mobiles, audio & wearables': 'Mobiles, Audio & Wearables',
            'computers, gaming & office.': 'Computers, Gaming & Office',
            'computers, gaming & office': 'Computers, Gaming & Office'
        };

        const knownBrands = ['apple', 'samsung', 'oneplus', 'redmi', 'realme', 'vivo', 'oppo', 'google', 'motorola', 'mi', 'xiaomi', 'boat', 'noise', 'boult', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'msi', 'logitech'];

        let currentCategory = 'Mobiles, Audio & Wearables';
        const productsToInsert = [];

        let barcodeCounter = 890600000000;

        rawRows.forEach((row, rowIdx) => {
            if (!row || row.length === 0) return;

            // Check if this row is a category header
            const nonOptCells = row.map((val, idx) => ({ val: String(val || '').trim(), idx })).filter(c => c.val !== '');
            const isHeader = nonOptCells.length === 1;
            
            if (isHeader) {
                const valStr = nonOptCells[0].val;
                const valLower = valStr.toLowerCase();
                if (sheetHeaderToCategory[valLower]) {
                    currentCategory = sheetHeaderToCategory[valLower];
                } else if (valLower.includes('mobile') || valLower.includes('audio') || valLower.includes('wearable')) {
                    currentCategory = 'Mobiles, Audio & Wearables';
                } else if (valLower.includes('computer') || valLower.includes('gaming') || valLower.includes('office')) {
                    currentCategory = 'Computers, Gaming & Office';
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

            // Find URL in cells
            let rawUrl = '';
            row.forEach(cell => {
                if (cell && String(cell).startsWith('http')) {
                    rawUrl = String(cell).trim();
                }
            });

            // If drive URL is present, resolve it. If share URL or web page URL, default to fallback
            const resolvedImage = resolveImageUrl(rawUrl) || 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?placeholder=true&w=500'; 

            const barcode = generateBarcode(barcodeCounter++);
            const normName = normalizeName(pName);

            productsToInsert.push({
                name: pName,
                normalizedName: normName,
                brand: pBrand,
                category: currentCategory,
                shopType: 'tech_accessories',
                imageUrl: resolvedImage,
                barcode: barcode,
                source: 'excel_tech',
                externalId: `tech_excel_${rowIdx}`,
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

        console.log(`Successfully seeded ${insertedCount} tech products into MongoDB.`);
        process.exit(0);
    } catch (err) {
        console.error('Critical seeding error:', err);
        process.exit(1);
    }
}

run();
