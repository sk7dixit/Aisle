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

const cleanProductName = (name) => {
    if (!name) return "";
    let cleaned = name.trim();
    // Strip leading numbers followed by dot and space(s), e.g. "1. Potato" -> "Potato" or "176. Habanero Pepper" -> "Habanero Pepper"
    cleaned = cleaned.replace(/^\d+\.\s*/, '');
    // Strip leading numbers followed by spaces
    cleaned = cleaned.replace(/^\d+\s+/, '');
    return cleaned.trim();
};

const isFallbackImage = (url) => {
    if (!url) return true;
    const lower = url.toLowerCase();
    return lower.includes('photo-1542838132-92c53300491e') || // General fallback
           lower.includes('photo-1584308666744-24d5c474f2ae') || // Medical fallback
           lower.includes('photo-1584017911766-d451b3d0e843') || // Surgical fallback
           lower.includes('photo-1611070973770-b1a672610041') || // Ayurvedic fallback
           lower.includes('placeholder.com') ||
           lower.includes('via.placeholder');
};

// Fallback search
async function fallbackSearch(productName, brand, category) {
    try {
        console.log(`[ImageResolver] Running fall-back API search for: "${productName}"`);
        const searchResult = await searchProductImage(productName, { brand, category });
        if (searchResult) {
            console.log(`[ImageResolver] API Search resolved image: ${searchResult}`);
            if (isFallbackImage(searchResult)) {
                return ''; // treat generic fallbacks as "unable to fetch"
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
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
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
        
        // 3c. IndiaMart specific parser
        if (!imgUrl && url.includes('indiamart.com')) {
            const imMatch = html.match(/https?:\/\/[a-z0-9\.\-]*\.imimg\.com\/data\d+\/[a-zA-Z0-9_\-\.\/\%]+/gi) || [];
            const goodImgs = imMatch.filter(img => img.includes('/500x500/') || img.includes('/250x250/'));
            if (goodImgs.length > 0) {
                imgUrl = goodImgs[0];
            } else if (imMatch.length > 0) {
                imgUrl = imMatch[0];
            }
        }

        // 3d. Patanjali specific parser
        if (!imgUrl && (url.includes('patanjaliayurved.net') || url.includes('patanjalifoods.com'))) {
            const patanjaliImgs = html.match(/https?:\/\/[a-z0-9\.\-]*patanjaliayurved\.net\/media\/images\/product-image\/[a-zA-Z0-9_\-\.\/\%]+/gi) || [];
            if (patanjaliImgs.length > 0) {
                imgUrl = patanjaliImgs[0];
            }
        }
        
        // 3e. WooCommerce specific parsing (data-large_image or wp-post-image)
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
        
        // 3f. Standard og:image / twitter:image meta tags
        if (!imgUrl) {
            const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                            html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
            if (ogMatch && ogMatch[1]) {
                imgUrl = ogMatch[1];
            }
        }
        
        // 3g. Last-ditch uploads / products regex search in HTML
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

// Category header checker
const checkCategoryHeader = (row) => {
    let hasUrl = false;
    for (let c = 0; c < row.length; c++) {
        const val = row[c] !== undefined ? String(row[c]).trim() : "";
        if (!val) continue;
        
        if (val.toLowerCase().includes('http') || val.toLowerCase().includes('www')) {
            hasUrl = true;
            break;
        }
    }
    
    if (hasUrl) return null;
    
    for (let c = 0; c < row.length; c++) {
        const val = row[c] !== undefined ? String(row[c]).trim() : "";
        if (!val) continue;
        
        const norm = val.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (norm === 'generalprovisionkirana' || norm === 'generalprovision') {
            return 'General Provision / Kirana';
        }
        if (norm === 'fruitsandveg' || norm === 'fruitsandvegetables' || norm === 'fruitsvegetables' || norm === 'fruitsveg') {
            return 'Fruits & Vegetables';
        }
        if (norm === 'dairyicecream' || norm === 'dairyandicecream') {
            return 'Dairy & Ice Cream';
        }
        if (norm === 'bakerycakeshop' || norm === 'bakeryandcakeshop') {
            return 'Bakery & Cake Shop';
        }
        if (norm === 'sweetshopmithaifarsan' || norm === 'sweetshop') {
            return 'Sweet Shop (Mithai & Farsan)';
        }
        if (norm === 'dryfruitsspices' || norm === 'dryfruitsandspices') {
            return 'Dry Fruits & Spices';
        }
        if (norm === 'wholesalegrainmart' || norm === 'wholesale' || norm === 'wholesaleandgrainmart') {
            return 'Wholesale / Grain Mart';
        }
    }
    
    return null;
};

async function run() {
    try {
        console.log('Connecting to Database...');
        await connectDB();
        console.log('Database connected successfully!');

        // Clean out old MasterCatalogProduct entries for grocery_kirana to ensure clean state
        console.log('Cleaning old MasterCatalogProduct entries for grocery_kirana...');
        const cleanRes = await MasterCatalogProduct.deleteMany({ shopType: 'grocery_kirana' });
        console.log(`Removed ${cleanRes.deletedCount} old catalog products.`);

        // Read the Excel sheet
        const filePath = 's:/Aisle/Excel/remaning groceery.xlsx';
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
        let maxBarcodeNum = 890100000000;
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
        let activeCategory = 'General Provision / Kirana'; // default fallback

        for (let r = 0; r < range.length; r++) {
            const row = range[r];
            if (!row || row.length === 0) continue;

            const categoryHeader = checkCategoryHeader(row);
            if (categoryHeader) {
                activeCategory = categoryHeader;
                console.log(`[Parser] Category Switched: "${activeCategory}" at row ${r}`);
                continue;
            }

            const col0 = row[0] !== undefined ? String(row[0]).trim() : "";
            const col5 = row[5] !== undefined ? String(row[5]).trim() : "";

            if (!col0 && !col5) continue;

            // Lookahead URL mapping: If this row has a product name but no URL
            let productUrl = col5;
            if (col0 && !col5) {
                for (let offset = 1; offset <= 3; offset++) {
                    const nextIdx = r + offset;
                    if (nextIdx < range.length && range[nextIdx]) {
                        const nextCol0 = range[nextIdx][0] !== undefined ? String(range[nextIdx][0]).trim() : "";
                        const nextCol5 = range[nextIdx][5] !== undefined ? String(range[nextIdx][5]).trim() : "";
                        if (!nextCol0 && nextCol5) {
                            productUrl = nextCol5;
                            console.log(`[Parser] Mapped URL from Row ${nextIdx} to Product "${col0}" at Row ${r}: ${productUrl}`);
                            // Consume the URL so it's not reused
                            range[nextIdx][5] = undefined;
                            break;
                        }
                    }
                }
            }

            // Otherwise, it is a product row (if col0 exists)
            if (col0) {
                validProducts.push({
                    name: col0,
                    url: productUrl,
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

                    const cleanName = cleanProductName(rawName);
                    const { brand, cleanName: extractedCleanName } = extractProductKeywords(cleanName);
                    const normName = normalizeName(cleanName);

                    // Intelligent brand extraction fallback
                    let finalBrand = brand;
                    if (!brand || brand.toLowerCase() === cleanName.toLowerCase()) {
                        finalBrand = (category === 'Fruits & Vegetables') ? 'Fresh' : 'Generic';
                    }

                    // Check if duplicate exists locally
                    const existing = await MasterCatalogProduct.findOne({
                        normalizedName: normName,
                        category: category,
                        shopType: 'grocery_kirana'
                    });

                    if (existing) {
                        console.log(`[DB] Product already exists: "${cleanName}" in "${category}". Skipping...`);
                        return;
                    }

                    // Resolve image URL
                    let resolvedImageUrl = await getImageUrl(url, cleanName, finalBrand, category);

                    // If unable to fetch image (i.e. empty string or fallback stock photo), use the product name
                    if (isFallbackImage(resolvedImageUrl)) {
                        resolvedImageUrl = cleanName;
                        console.log(`[ImageResolver] No image found or fallback returned. Using product name fallback: "${resolvedImageUrl}"`);
                    }

                    const barcode = generateBarcode(barcodeCounter++);
                    
                    const newProduct = new MasterCatalogProduct({
                        name: cleanName,
                        normalizedName: normName,
                        brand: finalBrand,
                        category: category,
                        shopType: 'grocery_kirana',
                        imageUrl: resolvedImageUrl,
                        barcode: barcode,
                        source: 'excel_grocery',
                        externalId: `grocery_excel_${item.rowIndex}`,
                        verified: true,
                        catalogStatus: 'verified'
                    });

                    await newProduct.save();
                    console.log(`[DB] Created product: "${cleanName}" | Category: "${category}" | Image: ${resolvedImageUrl.substring(0, 60)}... | Barcode: ${barcode}`);
                    successCount++;
                } catch (rowErr) {
                    console.error(`Error processing item "${item.name}" at row ${item.rowIndex}:`, rowErr);
                }
            }));

            // Pause slightly between batches to protect API limits
            await new Promise(res => setTimeout(res, 500));
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
