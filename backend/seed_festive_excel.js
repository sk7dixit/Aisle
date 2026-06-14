const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const xlsx = require('xlsx');

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

// Fallback search
async function fallbackSearch(productName, brand, category) {
    try {
        console.log(`[ImageResolver] Running fall-back API search for: "${productName}"`);
        const searchResult = await searchProductImage(productName, { brand, category });
        if (searchResult) {
            console.log(`[ImageResolver] API Search resolved image: ${searchResult}`);
            if (searchResult.includes('photo-1542838132-92c53300491e')) {
                return '';
            }
            return searchResult;
        }
    } catch (err) {
        console.log(`[ImageResolver] API Search failed for "${productName}": ${err.message}`);
    }
    
    return '';
}

// Image resolver
async function getImageUrl(url, productName, brand, category) {
    if (!url) {
        console.log(`[ImageResolver] No URL provided for "${productName}". Using search fallback.`);
        return await fallbackSearch(productName, brand, category);
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
    
    // 3. Webpage Scrape
    try {
        console.log(`[ImageResolver] Scraping webpage: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 7000
        });
        
        const html = response.data;
        let imgUrl = null;
        
        // 3a. Amazon specific parser
        if (url.includes('amazon.in') || url.includes('amazon.com')) {
            const landingImgMatch = html.match(/<img[^>]+id=["']landingImage["'][^>]*>/i);
            if (landingImgMatch) {
                const tag = landingImgMatch[0];
                const hiResMatch = tag.match(/data-old-hires=["']([^"']+)["']/i);
                if (hiResMatch && hiResMatch[1]) {
                    imgUrl = hiResMatch[1];
                } else {
                    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
                    if (srcMatch && srcMatch[1]) {
                        imgUrl = srcMatch[1];
                    }
                }
            }
            if (!imgUrl) {
                const hiResJsonMatch = html.match(/"hiRes"\s*:\s*["']([^"']+)["']/i) || html.match(/'hiRes'\s*:\s*["']([^"']+)["']/i);
                if (hiResJsonMatch && hiResJsonMatch[1]) {
                    imgUrl = hiResJsonMatch[1];
                }
            }
            if (!imgUrl) {
                const allAmazonImgs = html.match(/https?:\/\/[a-z0-9\.\-]*media-amazon\.com\/images\/I\/[a-zA-Z0-9_\-\.\%]+/gi) || [];
                const goodImgs = allAmazonImgs.filter(img => !img.includes('_SS') && !img.includes('_SR') && !img.includes('_AC_US40_'));
                if (goodImgs.length > 0) {
                    imgUrl = goodImgs[0];
                } else if (allAmazonImgs.length > 0) {
                    imgUrl = allAmazonImgs[0];
                }
            }
        }
        
        // 3b. BigBasket specific parser
        if (!imgUrl && url.includes('bigbasket.com')) {
            const bbRegex = /https?:\/\/www\.bbassets\.com\/media\/uploads\/p\/(xxl|xl|l|m)\/[a-zA-Z0-9_\-\.\/]+/gi;
            const matches = html.match(bbRegex);
            if (matches && matches.length > 0) {
                const sorted = matches.sort((a, b) => {
                    const getRank = (str) => {
                        if (str.includes('/xxl/')) return 4;
                        if (str.includes('/xl/')) return 3;
                        if (str.includes('/l/')) return 2;
                        if (str.includes('/m/')) return 1;
                        return 0;
                    };
                    return getRank(b) - getRank(a);
                });
                imgUrl = sorted[0];
            }
        }
        
        // 3c. WooCommerce specific parsing (data-large_image or wp-post-image)
        if (!imgUrl) {
            const largeImageAttr = html.match(/data-large_image=["']([^"']+)["']/i);
            if (largeImageAttr && largeImageAttr[1]) {
                imgUrl = largeImageAttr[1];
            }
        }
        
        if (!imgUrl) {
            const wpPostImgMatch = html.match(/<img[^>]+class=["'][^"']*(wp-post-image|woocommerce-main-image|zoomImg)[^"']*["'][^>]*>/i);
            if (wpPostImgMatch) {
                const tag = wpPostImgMatch[0];
                const srcMatch = tag.match(/src=["']([^"']+)["']/i) || tag.match(/data-src=["']([^"']+)["']/i);
                if (srcMatch && srcMatch[1]) {
                    imgUrl = srcMatch[1];
                }
            }
        }
        
        // 3d. Standard og:image / twitter:image meta tags
        if (!imgUrl) {
            const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                            html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
            if (ogMatch && ogMatch[1]) {
                imgUrl = ogMatch[1];
            }
        }
        
        // 3e. Last-ditch uploads / products regex search in HTML
        if (!imgUrl) {
            const uploads = html.match(/https?:\/\/[^"'\s<>]*?wp-content\/uploads\/[^"'\s<>]*?\.(jpg|png|jpeg|webp)/gi) || [];
            const productImgs = uploads.filter(u => !u.includes('/elementor/') && !u.includes('/logo') && !u.includes('-logo') && !u.includes('/cropped-') && !u.includes('-150x150') && !u.includes('-100x100') && !u.includes('-32x32'));
            if (productImgs.length > 0) {
                imgUrl = productImgs[0];
            }
        }
        
        if (!imgUrl) {
            const shopifyImgs = html.match(/https?:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s<>]*?\.(jpg|png|jpeg|webp)/gi) || [];
            const cleanShopify = shopifyImgs.filter(u => !u.includes('/logo') && !u.includes('-logo') && !u.includes('/icon'));
            if (cleanShopify.length > 0) {
                imgUrl = cleanShopify[0];
            }
        }

        if (imgUrl) {
            if (imgUrl.startsWith('//')) {
                imgUrl = 'https:' + imgUrl;
            } else if (imgUrl.startsWith('/')) {
                const parsedUrl = new URL(url);
                imgUrl = parsedUrl.origin + imgUrl;
            }
            imgUrl = imgUrl.replace(/&amp;/g, '&');
            console.log(`[ImageResolver] Successfully extracted direct image: ${imgUrl}`);
            return imgUrl;
        }
    } catch (err) {
        console.log(`[ImageResolver] Direct webpage scrape failed for "${url}": ${err.message}`);
    }
    
    // 4. Fallback search
    return await fallbackSearch(productName, brand, category);
}

async function run() {
    try {
        console.log('Connecting to Database...');
        await connectDB();
        console.log('Database connected successfully!');
        
        // Clean out any old MasterCatalogProduct entries for seasonal_festive to avoid double-seeding
        console.log('Cleaning old MasterCatalogProduct entries for seasonal_festive...');
        const cleanRes = await MasterCatalogProduct.deleteMany({ shopType: 'seasonal_festive', source: 'excel_festive' });
        console.log(`Removed ${cleanRes.deletedCount} old catalog products.`);

        // Read the Excel sheet
        const filePath = 's:/Aisle/Excel/Festive.xlsx';
        if (!fs.existsSync(filePath)) {
            console.error(`Error: Excel file not found at ${filePath}`);
            process.exit(1);
        }

        console.log('Reading Excel file...');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets['Sheet1'];
        const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`Loaded ${range.length} rows from Excel sheet.`);

        // Determine starting barcode number
        const productsWithBarcode = await MasterCatalogProduct.find({ barcode: { $exists: true } });
        let maxBarcodeNum = 890200000000;
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

        // Parse excel rows into structured categories and products
        const validProducts = [];
        let activeCategory = 'Festival Specific'; // default fallback

        for (let r = 0; r < range.length; r++) {
            const row = range[r];
            if (!row || row.length === 0) continue;

            const col0 = row[0] !== undefined ? String(row[0]).trim() : "";
            const col3 = row[3] !== undefined ? String(row[3]).trim() : "";

            if (!col0 && !col3) continue;

            // Check if it's a category header row
            if (col0 && !col3) {
                const normalizedHeader = col0.toLowerCase();
                if (normalizedHeader === 'festival specific') {
                    activeCategory = 'Festival Specific';
                    console.log(`[Parser] Category Switched: "Festival Specific" at row ${r}`);
                    continue;
                } else if (normalizedHeader === 'crackers & fireworks') {
                    activeCategory = 'Crackers & Fireworks';
                    console.log(`[Parser] Category Switched: "Crackers & Fireworks" at row ${r}`);
                    continue;
                } else if (normalizedHeader === 'winter / rain gear') {
                    activeCategory = 'Winter / Rain Gear';
                    console.log(`[Parser] Category Switched: "Winter / Rain Gear" at row ${r}`);
                    continue;
                }
            }

            // Otherwise, it is a product row
            if (col0) {
                validProducts.push({
                    name: col0,
                    url: col3,
                    category: activeCategory,
                    rowIndex: r
                });
            }
        }

        console.log(`Parsed ${validProducts.length} products from sheet.`);

        let successCount = 0;
        const BATCH_SIZE = 5;

        for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
            const batch = validProducts.slice(i, i + BATCH_SIZE);
            console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validProducts.length / BATCH_SIZE)} (Items ${i + 1} to ${i + batch.length})...`);

            await Promise.all(batch.map(async (item) => {
                try {
                    const rawName = item.name;
                    const url = item.url;
                    const category = item.category;

                    const { brand, cleanName } = extractProductKeywords(rawName);
                    const normName = normalizeName(rawName);

                    // Check if duplicate exists locally
                    const existing = await MasterCatalogProduct.findOne({
                        normalizedName: normName,
                        category: category,
                        shopType: 'seasonal_festive'
                    });

                    if (existing) {
                        console.log(`[DB] Product already exists: "${rawName}" in "${category}". Skipping...`);
                        return;
                    }

                    // Resolve dynamic or scraped image url
                    const resolvedImageUrl = await getImageUrl(url, rawName, brand || 'Seasonal', category);

                    const barcode = generateBarcode(barcodeCounter++);
                    
                    const newProduct = new MasterCatalogProduct({
                        name: rawName,
                        normalizedName: normName,
                        brand: brand || 'Seasonal',
                        category: category,
                        shopType: 'seasonal_festive',
                        imageUrl: resolvedImageUrl,
                        barcode: barcode,
                        source: 'excel_festive',
                        externalId: `festive_excel_${item.rowIndex}`,
                        verified: true,
                        catalogStatus: 'verified'
                    });

                    await newProduct.save();
                    console.log(`[DB] Created product: "${rawName}" | Category: "${category}" | Barcode: ${barcode}`);
                    successCount++;
                } catch (rowErr) {
                    console.error(`Error processing item "${item.name}" at row ${item.rowIndex}:`, rowErr);
                }
            }));

            // Pause slightly between batches to protect API limits
            await new Promise(res => setTimeout(res, 1000));
        }

        console.log(`\nSeeding completed successfully!`);
        console.log(`Created new master catalog products: ${successCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Critical seeding error:', err);
        process.exit(1);
    }
}

run();
