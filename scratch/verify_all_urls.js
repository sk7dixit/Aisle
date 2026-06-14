const xlsx = require('xlsx');
const axios = require('axios');
const fs = require('fs');

const excelPath = 's:/Aisle/Excel/Festive.xlsx';

async function run() {
    try {
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets['Sheet1'];
        const range = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log(`Loaded ${range.length} rows from Excel.`);
        
        const products = [];
        let activeCategory = 'Festival Specific';
        
        for (let r = 0; r < range.length; r++) {
            const row = range[r];
            if (!row || row.length === 0) continue;
            const col0 = row[0] !== undefined ? String(row[0]).trim() : "";
            const col3 = row[3] !== undefined ? String(row[3]).trim() : "";
            
            if (!col0 && !col3) continue;
            
            if (col0 && !col3) {
                const normalizedHeader = col0.toLowerCase();
                if (normalizedHeader === 'festival specific') {
                    activeCategory = 'Festival Specific';
                    continue;
                } else if (normalizedHeader === 'crackers & fireworks') {
                    activeCategory = 'Crackers & Fireworks';
                    continue;
                } else if (normalizedHeader === 'winter / rain gear') {
                    activeCategory = 'Winter / Rain Gear';
                    continue;
                }
            }
            
            if (col0 && col3) {
                products.push({
                    name: col0,
                    url: col3,
                    category: activeCategory,
                    rowIndex: r
                });
            }
        }
        
        console.log(`Parsed ${products.length} products. Testing scraping on each...`);
        
        const results = [];
        // Test sequentially to avoid rate-limiting
        for (let i = 0; i < products.length; i++) {
            const prod = products[i];
            const url = prod.url;
            let success = false;
            let resolvedImage = null;
            let errorMsg = null;
            
            // Check direct image links
            if (url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes('gstatic.com') || url.includes('googleusercontent.com')) {
                resolvedImage = url;
                success = true;
            } else if (url.includes('drive.google.com')) {
                const match = url.match(/\/file\/d\/([^\/\?]+)/) || url.match(/[?&]id=([^&]+)/);
                if (match) {
                    resolvedImage = `https://lh3.googleusercontent.com/d/${match[1]}`;
                    success = true;
                }
            } else {
                try {
                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9'
                        },
                        timeout: 5000
                    });
                    
                    const html = response.data;
                    
                    // Domain specific parsers
                    if (url.includes('bigbasket.com')) {
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
                            resolvedImage = sorted[0];
                            success = true;
                        }
                    } else if (url.includes('amazon.in') || url.includes('amazon.com')) {
                        const landingImgMatch = html.match(/<img[^>]+id=["']landingImage["'][^>]*>/i);
                        if (landingImgMatch) {
                            const tag = landingImgMatch[0];
                            const hiResMatch = tag.match(/data-old-hires=["']([^"']+)["']/i);
                            if (hiResMatch && hiResMatch[1]) {
                                resolvedImage = hiResMatch[1];
                                success = true;
                            } else {
                                const srcMatch = tag.match(/src=["']([^"']+)["']/i);
                                if (srcMatch && srcMatch[1]) {
                                    resolvedImage = srcMatch[1];
                                    success = true;
                                }
                            }
                        }
                        if (!success) {
                            const hiResJsonMatch = html.match(/"hiRes"\s*:\s*["']([^"']+)["']/i) || html.match(/'hiRes'\s*:\s*["']([^"']+)["']/i);
                            if (hiResJsonMatch && hiResJsonMatch[1]) {
                                resolvedImage = hiResJsonMatch[1];
                                success = true;
                            }
                        }
                        if (!success) {
                            const allAmazonImgs = html.match(/https?:\/\/[a-z0-9\.\-]*media-amazon\.com\/images\/I\/[a-zA-Z0-9_\-\.\%]+/gi) || [];
                            const goodImgs = allAmazonImgs.filter(img => !img.includes('_SS') && !img.includes('_SR') && !img.includes('_AC_US40_'));
                            if (goodImgs.length > 0) {
                                resolvedImage = goodImgs[0];
                                success = true;
                            } else if (allAmazonImgs.length > 0) {
                                resolvedImage = allAmazonImgs[0];
                                success = true;
                            }
                        }
                    }
                    
                    // Standard og:image meta tags
                    if (!success) {
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
                            resolvedImage = imgUrl;
                            success = true;
                        }
                    }
                    
                    if (!success) {
                        errorMsg = "No image found in webpage content";
                    }
                } catch (err) {
                    errorMsg = err.message;
                }
            }
            
            results.push({
                name: prod.name,
                url: prod.url,
                rowIndex: prod.rowIndex,
                success,
                resolvedImage,
                errorMsg
            });
            
            if (i % 20 === 0 && i > 0) {
                console.log(`Tested ${i}/${products.length} products...`);
            }
            
            // Short delay to respect target domains
            await new Promise(r => setTimeout(r, 150));
        }
        
        const failed = results.filter(r => !r.success);
        console.log(`\n================ RESULT ================\n`);
        console.log(`Total Tested: ${products.length}`);
        console.log(`Success (Scraped directly): ${products.length - failed.length}`);
        console.log(`Failed: ${failed.length}`);
        
        console.log(`\nFailed Products List:`);
        failed.forEach((f, idx) => {
            console.log(`${idx + 1}. Row ${f.rowIndex}: "${f.name}"\n   Link: ${f.url}\n   Reason: ${f.errorMsg}\n`);
        });
        
    } catch (err) {
        console.error("Critical error in verify script:", err);
    }
}

run();
