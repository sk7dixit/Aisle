const mongoose = require("mongoose");
const path = require("path");
const axios = require("axios");
const XLSX = require("xlsx");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, 'backend/.env') });

const Product = require("./backend/models/MasterCatalogProduct");
const { searchProductImage } = require("./backend/services/googleImageService");

// Resolve brand
const getBrandFromName = (name) => {
    if (!name) return 'Generic';
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const firstWord = cleanName.split(/\s+/)[0];
    if (firstWord && firstWord.length > 2) {
        return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
    return 'Generic';
};

const extractImageFromHtml = (html, pageUrl) => {
    const cleanUrl = (url) => {
        if (!url) return '';
        let trimmed = url.trim();
        if (trimmed.startsWith('//')) {
            trimmed = 'https:' + trimmed;
        } else if (trimmed.startsWith('/')) {
            try {
                const parsed = new URL(pageUrl);
                trimmed = parsed.origin + trimmed;
            } catch (e) {}
        }
        return trimmed;
    };

    const isBadImage = (url) => {
        const lower = url.toLowerCase();
        return lower.includes('logo') || 
               lower.includes('icon') || 
               lower.includes('banner') || 
               lower.includes('category') ||
               lower.includes('sprite') || 
               lower.includes('captcha') || 
               lower.includes('pixel') || 
               lower.includes('transparent') || 
               lower.includes('spacer') ||
               lower.includes('/images/g/');
    };

    const jsonMatches = [];
    const jsonImgRegex = /"image"\s*:\s*"(https:\/\/cdn01\.pharmeasy\.in\/dam\/products[^"]+)"/g;
    let match;
    while ((match = jsonImgRegex.exec(html)) !== null) {
        jsonMatches.push(match[1]);
    }
    if (jsonMatches.length > 0) return jsonMatches[0];

    const genericJsonRegex = /"image"\s*:\s*"(https?:\/\/[^"]+)"/g;
    let genericMatch;
    while ((genericMatch = genericJsonRegex.exec(html)) !== null) {
        const url = genericMatch[1];
        if (!isBadImage(url)) {
            return url;
        }
    }

    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
        const url = cleanUrl(ogMatch[1]);
        if (url && !isBadImage(url)) {
            return url;
        }
    }

    const twitterMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                          html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i);
    if (twitterMatch && twitterMatch[1]) {
        const url = cleanUrl(twitterMatch[1]);
        if (url && !isBadImage(url)) {
            return url;
        }
    }

    const matchUrls = html.match(/https?:\/\/[^"'\s>]+\.(jpg|jpeg|png|webp)/gi) || [];
    for (const rawUrl of matchUrls) {
        const url = cleanUrl(rawUrl);
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('/products/') || lowerUrl.includes('/product/') || lowerUrl.includes('/catalog/') || lowerUrl.includes('/dam/') || lowerUrl.includes('/images/')) {
            if (!isBadImage(url)) {
                return url;
            }
        }
    }
    return '';
};

// Scrape URL
const scrapeProductPageImage = async (url) => {
    if (!url || !url.startsWith('http')) return '';
    try {
        console.log(`[Scraper] Fetching page: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, fill: true, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 3000
        });
        const img = extractImageFromHtml(response.data, url);
        if (img) {
            console.log(`[Scraper] Scraped image from HTML: ${img}`);
            return img;
        }
    } catch (e) {
        console.warn(`[Scraper] Failed to scrape page ${url}: ${e.message}`);
    }
    return '';
};

// Google redirect link decoder
const resolveGoogleRedirectUrl = (rawUrl) => {
    if (!rawUrl) return '';
    try {
        if (rawUrl.includes('imgurl=')) {
            const parsedUrl = new URL(rawUrl);
            const imgUrlParam = parsedUrl.searchParams.get('imgurl');
            if (imgUrlParam) {
                return decodeURIComponent(imgUrlParam);
            }
        }
        const trimmed = rawUrl.trim();
        if (trimmed.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || trimmed.includes('images.unsplash.com') || trimmed.includes('googleusercontent.com') || trimmed.includes('media-amazon.com')) {
            return trimmed;
        }
    } catch (e) {}
    return '';
};

async function seedAll() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/aisle");
        console.log("Connected successfully.");

        const shopType = "pharmacy";
        console.log("Clearing existing pharmacy master products...");
        await Product.deleteMany({ shopType });

        const filePath = 's:\\Shoplens Proj\\Excel\\Pharmacy.xlsx';
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`Loaded ${rawRows.length} raw rows from Pharmacy.xlsx.`);

        // Process in chunks of 5 for concurrency
        const chunkSize = 5;
        const productsToInsert = [];

        for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length === 0) continue;

            const col0 = String(row[0] || '').trim();
            if (!col0) continue;

            if (col0 === 'Allopathic Medicines' || col0 === 'Ayurvedic & Wellness' || col0 === 'Surgical, Rehab & General') {
                continue;
            }

            let category = 'surgical-equipment';
            if (i > 0 && i < 86) {
                category = 'allopathic-chemist';
            } else if (i > 86 && i < 157) {
                category = 'ayurvedic-herbal';
            } else if (i > 157) {
                category = 'surgical-equipment';
            }

            const rawUrl = String(row[3] || '').trim();
            const brand = getBrandFromName(col0);
            const barcode = `8903${String(i).padStart(9, '0')}`;
            const externalId = `excel_pharm_${category}_${i}`;

            productsToInsert.push({
                index: i,
                name: col0,
                brand,
                category,
                rawUrl,
                barcode,
                externalId
            });
        }

        console.log(`Prepared ${productsToInsert.length} products to resolve and seed.`);

        let count = 0;

        for (let idx = 0; idx < productsToInsert.length; idx += chunkSize) {
            const chunk = productsToInsert.slice(idx, idx + chunkSize);
            
            const promises = chunk.map(async (item) => {
                let resolvedImage = resolveGoogleRedirectUrl(item.rawUrl);
                
                // If it's a webpage link, attempt to scrape it
                if (!resolvedImage && item.rawUrl && item.rawUrl.startsWith('http')) {
                    resolvedImage = await scrapeProductPageImage(item.rawUrl);
                }

                // If scraping fails, call Google Search API fallback
                if (!resolvedImage) {
                    console.log(`[Search] Image not found for "${item.name}". Searching Google Image API...`);
                    resolvedImage = await searchProductImage(`${item.brand} ${item.name}`, { brand: item.brand, category: item.category });
                }

                // Ultimate fallback if everything fails
                if (!resolvedImage) {
                    resolvedImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500';
                }

                const finalCategoryLabel = item.category === 'allopathic-chemist' ? 'Allopathic Chemist' :
                                           item.category === 'ayurvedic-herbal' ? 'Ayurvedic & Herbal' :
                                           'Surgical & Equipment';

                await Product.create({
                    name: item.name,
                    brand: item.brand,
                    category: finalCategoryLabel,
                    imageUrl: resolvedImage,
                    source: 'pharmacy-excel',
                    barcode: item.barcode,
                    externalId: item.externalId,
                    normalizedName: item.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    shopType
                });

                count++;
                console.log(`[Seeder] [${count}/${productsToInsert.length}] Seeded: "${item.name}" -> ${resolvedImage}`);
            });

            await Promise.all(promises);
        }

        console.log(`All ${count} pharmacy products seeded successfully!`);

    } catch (err) {
        console.error("Failed to seed all products:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

seedAll();
