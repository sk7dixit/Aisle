const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const MasterCatalogProduct = require('./models/MasterCatalogProduct');
const { searchProductImage, extractProductKeywords } = require('./services/googleImageService');

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

// Image resolver
async function getImageUrl(url, productName, brand) {
    if (!url) {
        console.log(`[ImageResolver] No URL provided for "${productName}". Using search fallback.`);
        return await fallbackSearch(productName, brand);
    }
    
    // 1. Check if Google Drive Link
    if (url.includes('drive.google.com')) {
        const match = url.match(/\/file\/d\/([^\/\?]+)/) || url.match(/[?&]id=([^&]+)/);
        if (match) {
            const fileId = match[1];
            const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            console.log(`[ImageResolver] Converted Google Drive URL to direct view URL: ${directUrl}`);
            return directUrl;
        }
    }
    
    // 2. Direct Image Link
    if (url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes('gstatic.com') || url.includes('googleusercontent.com')) {
        console.log(`[ImageResolver] Direct image link detected: ${url}`);
        return url;
    }
    
    // 3. Webpage Scrape (e.g. og:image)
    try {
        console.log(`[ImageResolver] Scraping webpage for og:image: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 6000
        });
        
        const html = response.data;
        // Simple regex to match og:image or twitter:image
        let ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
                      
        if (ogMatch && ogMatch[1]) {
            let imgUrl = ogMatch[1];
            if (imgUrl.startsWith('//')) {
                imgUrl = 'https:' + imgUrl;
            } else if (imgUrl.startsWith('/')) {
                const parsedUrl = new URL(url);
                imgUrl = parsedUrl.origin + imgUrl;
            }
            console.log(`[ImageResolver] Successfully extracted og:image: ${imgUrl}`);
            return imgUrl;
        }
    } catch (err) {
        console.log(`[ImageResolver] Webpage scrape failed for "${url}": ${err.message}`);
    }
    
    // 4. Fallback search
    return await fallbackSearch(productName, brand);
}

async function fallbackSearch(productName, brand) {
    try {
        console.log(`[ImageResolver] Running fall-back API search for: "${productName}"`);
        const searchResult = await searchProductImage(productName, { brand, category: 'Organic / Gourmet' });
        if (searchResult) {
            console.log(`[ImageResolver] API Search resolved image: ${searchResult}`);
            return searchResult;
        }
    } catch (err) {
        console.log(`[ImageResolver] API Search failed for "${productName}": ${err.message}`);
    }
    
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500';
}

async function run() {
    try {
        console.log('Connecting to Database...');
        await connectDB();
        console.log('Database connected successfully!');
        
        // Load the extracted JSON data
        const jsonPath = path.join(__dirname, '../extracted_organic.json');
        if (!fs.existsSync(jsonPath)) {
            console.error(`Error: JSON file not found at ${jsonPath}`);
            process.exit(1);
        }
        
        const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`Loaded ${rawData.length} rows from JSON.`);
        
        // Determine starting barcode number
        // Let's find the max barcode from existing grocery products
        const productsWithBarcode = await MasterCatalogProduct.find({ barcode: { $exists: true } });
        let maxBarcodeNum = 890100010000;
        for (const prod of productsWithBarcode) {
            if (prod.barcode && prod.barcode.length === 13) {
                const basePart = parseInt(prod.barcode.substring(0, 12));
                if (!isNaN(basePart) && basePart > maxBarcodeNum) {
                    maxBarcodeNum = basePart;
                }
            }
        }
        let barcodeCounter = maxBarcodeNum + 1;
        console.log(`Starting barcode counter base at: ${barcodeCounter}`);
        
        // Let's filter out rows that have no name or have invalid data
        const validRows = rawData.filter(row => {
            const name = row['Organic / Gourmet:'];
            return name && name.trim() && name.toLowerCase() !== 'organic / gourmet:';
        });
        
        console.log(`Processing ${validRows.length} valid product rows...`);
        
        let successCount = 0;
        let updateCount = 0;
        
        // Batch size for concurrency
        const BATCH_SIZE = 5;
        for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
            const batch = validRows.slice(i, i + BATCH_SIZE);
            console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validRows.length / BATCH_SIZE)} (Items ${i + 1} to ${i + batch.length})...`);
            
            await Promise.all(batch.map(async (row) => {
                const rawName = row['Organic / Gourmet:'].trim();
                const url = row['__EMPTY_4'] ? row['__EMPTY_4'].trim() : '';
                
                // Extract brand and clean name
                const { brand, cleanName } = extractProductKeywords(rawName);
                const normName = normalizeName(rawName);
                
                // Check if product already exists
                const existing = await MasterCatalogProduct.findOne({
                    normalizedName: normName,
                    category: 'Organic / Gourmet',
                    shopType: 'grocery_kirana'
                });
                
                // Resolve image URL
                const resolvedImageUrl = await getImageUrl(url, rawName, brand || 'Organic');
                
                if (existing) {
                    // Update existing product's image
                    existing.imageUrl = resolvedImageUrl;
                    existing.source = 'excel_organic';
                    await existing.save();
                    console.log(`[DB] Updated existing product: "${rawName}" with image.`);
                    updateCount++;
                } else {
                    // Create new product
                    const barcode = generateBarcode(barcodeCounter++);
                    
                    const newProduct = new MasterCatalogProduct({
                        name: rawName,
                        normalizedName: normName,
                        brand: brand || 'Organic',
                        category: 'Organic / Gourmet',
                        shopType: 'grocery_kirana',
                        imageUrl: resolvedImageUrl,
                        barcode: barcode,
                        source: 'excel_organic',
                        externalId: `organic_excel_${successCount}`
                    });
                    
                    await newProduct.save();
                    console.log(`[DB] Created new product: "${rawName}" | Barcode: ${barcode}`);
                    successCount++;
                }
            }));
            
            // Wait brief moment to avoid hammer rate limits
            await new Promise(res => setTimeout(res, 1000));
        }
        
        console.log(`\nSeeding completed successfully!`);
        console.log(`Created new products: ${successCount}`);
        console.log(`Updated existing products: ${updateCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Critical execution error:', err);
        process.exit(1);
    }
}

run();
