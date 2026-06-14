const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function slugify(text) {
    if (!text) return "";
    return text.toString().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '_')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function resolveImageUrl(url) {
    if (!url) return null;
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
    return null;
}

const CATALOG_CONFIGS = {
    'GROCERY_KIRANA': {
        fileName: 'Grocery &Kirana List.xlsx',
        categories: [
            "General Provision / Kirana",
            "Fruits & Vegetables",
            "Dairy & Ice Cream",
            "Bakery & Cake Shop",
            "Sweet Shop (Mithai & Farsan)",
            "Dry Fruits & Spices",
            "Wholesale / Grain Mart",
            "Organic / Gourmet"
        ]
    },
    'ELECTRICAL_HARDWARE_AUTO': {
        fileName: 'elctrical.xlsx',
        singleSheetMode: true,
        categories: [
            "Electrical Shop",
            "Hardware & Sanitary",
            "Paints & Decor",
            "Automobile Spares",
            "Industrial / Power Tools"
        ]
    },
    'TECH_ACCESSORIES': {
        fileName: 'Tech and acessories.xlsx',
        singleSheetMode: true,
        categories: [
            "Mobiles, Audio & Wearables",
            "Computers, Gaming & Office",
            "TV & Home Appliances",
            "Spares & Repair Components"
        ]
    },
    'STUDENT_OFFICE': {
        fileName: 'Student & Office Supplies.xlsx',
        categories: [
            "All Categories",
            "School & Writing Supplies",
            "Office & Desk Accessories",
            "Art & Craft Materials",
            "Books & Paper Products"
        ]
    },
    'HOME_LIFESTYLE': {
        fileName: 'Home & Lifestyle Goods.xlsx',
        categories: [
            "All Categories",
            "Kitchenware & Cookware",
            "Plastics, Cleaning & Storage",
            "Beauty, Cosmetics & Personal Care",
            "Toys, Sports & Gifts",
            "Furnishing & Home Decor",
            "Bags & Luggage",
            "Footwear",
            "Clothing & Garments"
        ]
    },
    'PHARMACY': {
        fileName: 'Pharmacy or Medical Store.xlsx',
        categories: [
            "All Categories",
            "Allopathic Chemist",
            "Ayurvedic & Herbal",
            "Surgical & Equipment"
        ]
    },
    'HOME_BUSINESS': {
        fileName: 'Home Businesses.xlsx',
        categories: [
            "All Categories",
            "Homemade Food, Bakery & Catering",
            "Handmade Arts, Crafts & Jewelry",
            "Tuition, Coaching & Skill Classes"
        ]
    },
    'SEASONAL_FESTIVE': {
        fileName: 'Seasonal o Festive Store.xlsx',
        singleSheetMode: true,
        categories: [
            "All Categories",
            "Festival Specific",
            "Crackers & Fireworks",
            "Winter / Rain Gear"
        ]
    }
};

// Aliases for robustness
CATALOG_CONFIGS['ELECTRONICS_TOOLS'] = CATALOG_CONFIGS['ELECTRICAL_HARDWARE_AUTO'];
CATALOG_CONFIGS['GROCERY'] = CATALOG_CONFIGS['GROCERY_KIRANA'];

/**
 * Loads catalog data from Excel based on Shop Type
 * @param {string} shopType - Type of shop (e.g. GROCERY_KIRANA)
 */
function loadExcelCatalog(shopType = 'GROCERY_KIRANA') {
    // Normalize shop type
    const normalizedType = shopType.toUpperCase().replace(/\s/g, '_');
    const config = CATALOG_CONFIGS[normalizedType] || CATALOG_CONFIGS['GROCERY_KIRANA'];

    console.log(`[CATALOG_LOADER] Loading catalog for: ${normalizedType}`);

    const mandatoryCategories = config.categories;
    const fallbackCatalog = mandatoryCategories.map((name, index) => ({
        categoryId: slugify(name),
        categoryName: name,
        order: index,
        products: []
    }));

    try {
        const rootPath = process.cwd();
        const possiblePaths = [
            path.join('s:\\Aisle\\Excel', config.fileName),
            path.join('s:\\2K27_Project', config.fileName),
            path.join(rootPath, config.fileName),
            path.join(rootPath, 'backend', config.fileName)
        ];

        let filePath = null;
        for (const p of possiblePaths) {
            try {
                if (fs.existsSync(p)) {
                    filePath = p;
                    console.log(`[CATALOG_LOADER] Found Excel at: ${filePath}`);
                    break;
                }
            } catch (e) { /* ignore */ }
        }

        if (!filePath) {
            console.error(`[CATALOG_LOADER] No Excel file found for ${normalizedType} (${config.fileName})`);
            return fallbackCatalog;
        }

        const workbook = XLSX.readFile(filePath);
        if (!workbook || !workbook.SheetNames) return fallbackCatalog;

        const sheetsMap = {};
        workbook.SheetNames.forEach((sheetName, idx) => {
            const normalized = sheetName.toLowerCase().replace(/[^a-z0-9]/g, '');
            sheetsMap[normalized] = sheetName;
            sheetsMap[`sheet${idx + 1}`] = sheetName;
        });

        let sheetIndexOffset = 0;
        const result = mandatoryCategories.map((name, index) => {
            const isAll = name.toLowerCase().includes('all categories');
            if (isAll) {
                sheetIndexOffset++;
                return {
                    categoryId: 'all-categories',
                    categoryName: name,
                    order: index,
                    products: [],
                    _isAggregate: true
                };
            }

            const normalizedSearch = name.replace(/\//g, ' ').toLowerCase().replace(/[^a-z0-9]/g, '');
            const sheetNum = index + 1 - sheetIndexOffset;
            let actualSheetName = sheetsMap[normalizedSearch] || sheetsMap[`sheet${sheetNum}`];

            if (config.singleSheetMode && workbook.SheetNames.length > 0) {
                actualSheetName = workbook.SheetNames[0];
            }

            if (actualSheetName) {
                try {
                    const sheet = workbook.Sheets[actualSheetName];
                    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    // Find the header row
                    let headerIndex = -1;
                    const headerKeywords = ['product name', 'item name', 'brand', 'variety', 'type', 'specification', 'model', 'size', 'subject', 'details', 'fee'];
                    for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
                        const row = rawRows[i];
                        if (row && row.some(cell => {
                            if (!cell) return false;
                            const val = cell.toString().toLowerCase();
                            return headerKeywords.some(k => val.includes(k));
                        })) {
                            headerIndex = i;
                            break;
                        }
                    }

                    let headers = [];
                    let dataRows = [];
                    let nameIdx = 0;
                    let brandIdx = -1;
                    let specIdx = -1;
                    let priceIdx = -1;

                    if (headerIndex === -1 && normalizedType !== 'ELECTRICAL_HARDWARE_AUTO' && normalizedType !== 'ELECTRONICS_TOOLS' && normalizedType !== 'TECH_ACCESSORIES') {
                        return { categoryId: slugify(name), categoryName: name, order: index, products: [] };
                    }

                    if (headerIndex !== -1) {
                        headers = rawRows[headerIndex];
                        dataRows = rawRows.slice(headerIndex + 1);
                        const findCol = (terms) => headers.findIndex(h => terms.some(t => h && h.toString().toLowerCase().includes(t.toLowerCase())));
                        nameIdx = findCol(['product name', 'item name', 'brand / variety', 'variety', 'subject', 'details']);
                        brandIdx = findCol(['brand', 'variety', 'type', 'famous', 'company']);
                        specIdx = findCol(['weight', 'unit', 'specification', 'size', 'model', 'duration', 'frequency']);
                        priceIdx = findCol(['price', 'market price', 'mrp', 'rate', 'fee']);
                    } else {
                        dataRows = rawRows;
                        nameIdx = 0;
                    }

                    // Single Sheet Section Filtering
                    if (config.singleSheetMode && !isAll) {
                        const targetCategoryName = name;
                        const sectionProducts = [];
                        let currentCategory = "";

                        // Define maps/keywords
                        const sheetHeaderToCategory = {
                            'electrical & lighting': 'Electrical Shop',
                            'electrical items': 'Electrical Shop',
                            'tools & industrial supply': 'Industrial / Power Tools',
                            'industrial / power tools': 'Industrial / Power Tools',
                            'mobiles, audio & wearables': 'Mobiles, Audio & Wearables',
                            'computers, gaming & office.': 'Computers, Gaming & Office',
                            'computers, gaming & office': 'Computers, Gaming & Office'
                        };

                        let lastProductName = "";
                        dataRows.forEach((row, rowIdx) => {
                            if (!row || row.length === 0) return;

                            // Check if this row is a category header
                            const nonOptCells = row.map((val, idx) => ({ val: String(val || '').trim(), idx })).filter(c => c.val !== '');
                            const isHeader = nonOptCells.length === 1;
                            
                            if (isHeader) {
                                const valStr = nonOptCells[0].val;
                                const valLower = valStr.toLowerCase();
                                if (sheetHeaderToCategory[valLower]) {
                                    currentCategory = sheetHeaderToCategory[valLower];
                                } else if (valLower.includes('electrical')) {
                                    currentCategory = 'Electrical Shop';
                                } else if (valLower.includes('tool') || valLower.includes('industrial')) {
                                    currentCategory = 'Industrial / Power Tools';
                                } else if (valLower.includes('mobile') || valLower.includes('audio') || valLower.includes('wearable')) {
                                    currentCategory = 'Mobiles, Audio & Wearables';
                                } else if (valLower.includes('computer') || valLower.includes('gaming')) {
                                    currentCategory = 'Computers, Gaming & Office';
                                } else {
                                    const matched = config.categories.find(catName => 
                                        valLower.includes(catName.toLowerCase()) || catName.toLowerCase().includes(valLower)
                                    );
                                    if (matched) currentCategory = matched;
                                }
                                return;
                            }

                            if (!currentCategory) {
                                currentCategory = config.categories[0];
                            }

                            if (currentCategory.toLowerCase() !== targetCategoryName.toLowerCase()) {
                                return;
                            }

                            // Parse product row
                            let pName = row[nameIdx];
                            let pBrand = row[brandIdx] || "Loose / Fresh";
                            if (brandIdx === -1 && pName) {
                                const firstWord = pName.trim().split(/\s+/)[0];
                                const knownBrands = ['anchor', 'havells', 'gm', 'legrand', 'schneider', 'polycab', 'finolex', 'rr', 'kei', 'philips', 'wipro', 'syska', 'crompton', 'orient', 'bajaj', 'usha', 'atomberg', 'apple', 'samsung', 'oneplus', 'redmi', 'realme', 'vivo', 'oppo', 'google', 'motorola', 'mi', 'xiaomi', 'boat', 'noise', 'boult', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'msi', 'logitech'];
                                if (firstWord && knownBrands.includes(firstWord.toLowerCase())) {
                                    pBrand = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
                                } else {
                                    pBrand = "General";
                                }
                            }
                            const pSpec = row[specIdx] || "";
                            let pPriceRaw = "";
                            if (priceIdx !== -1) {
                                pPriceRaw = row[priceIdx] ? row[priceIdx].toString() : "";
                            }

                            if (pName && pName.toString().toLowerCase().includes('product name')) return;
                            if (pBrand && pBrand.toString().toLowerCase().includes('famous brands')) return;
                            if (pName && pName.toString().toLowerCase().includes('common brand')) return;

                            if (pName) {
                                lastProductName = pName;
                            } else if (pBrand && pBrand !== "Loose / Fresh") {
                                pName = lastProductName;
                            }

                            if (!pName) return;

                            const hasPrice = pPriceRaw && pPriceRaw.length > 0;
                            if (!hasPrice && (pName === 'Product Name' || pName.includes('Category:'))) return;

                            const pPrice = hasPrice ? pPriceRaw.replace(/,/g, '').replace(/[^\d\.]/g, ' ').trim().split(/\s+/)[0] : "0";
                            const brandDisplay = pBrand.split(',')[0].split('/')[0].trim();

                            let displayName = pName;
                            if (!row[nameIdx] && pBrand !== "Loose / Fresh") {
                                displayName = `${pName} - ${brandDisplay}`;
                            }
                            if (pSpec) displayName += ` (${pSpec})`;

                            let rawUrl = '';
                            row.forEach(cell => {
                                if (cell && String(cell).startsWith('http')) {
                                    rawUrl = String(cell).trim();
                                }
                            });
                            const pImage = resolveImageUrl(rawUrl);

                            sectionProducts.push({
                                baseName: displayName,
                                brand: brandDisplay,
                                image: pImage || 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?placeholder=true&w=500',
                                indicativePrice: pPrice || "0",
                                variantId: slugify(`${actualSheetName}_${displayName}_${brandDisplay}_${rowIdx}`)
                            });
                        });

                        console.log(`[CATALOG_LOADER] Loaded ${sectionProducts.length} products for single-sheet section: ${name}`);
                        return {
                            categoryId: slugify(name),
                            categoryName: name,
                            order: index,
                            products: sectionProducts
                        };
                    }

                    const findCol = (terms) => headers.findIndex(h => terms.some(t => h && h.toString().toLowerCase().includes(t.toLowerCase())));

                    nameIdx = findCol(['product name', 'item name', 'brand / variety', 'variety', 'subject', 'details']);
                    brandIdx = findCol(['brand', 'variety', 'type', 'famous', 'company']);
                    specIdx = findCol(['weight', 'unit', 'specification', 'size', 'model', 'duration', 'frequency']);
                    priceIdx = findCol(['price', 'market price', 'mrp', 'rate', 'fee']);

                    let lastProductName = "";
                    const products = [];

                    dataRows.forEach((row, rowIdx) => {
                        let pName = row[nameIdx];
                        let pBrand = row[brandIdx] || "Loose / Fresh";
                        if (brandIdx === -1 && pName) {
                            const firstWord = pName.trim().split(/\s+/)[0];
                            const knownBrands = ['anchor', 'havells', 'gm', 'legrand', 'schneider', 'polycab', 'finolex', 'rr', 'kei', 'philips', 'wipro', 'syska', 'crompton', 'orient', 'bajaj', 'usha', 'atomberg'];
                            if (firstWord && knownBrands.includes(firstWord.toLowerCase())) {
                                pBrand = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
                            } else {
                                pBrand = "General";
                            }
                        }
                        const pSpec = row[specIdx] || "";
                        let pPriceRaw = "";
                        if (priceIdx !== -1) {
                            pPriceRaw = row[priceIdx] ? row[priceIdx].toString() : "";
                        }

                        if (pName && pName.toString().toLowerCase().includes('product name')) return;
                        if (pBrand && pBrand.toString().toLowerCase().includes('famous brands')) return;
                        if (pName && pName.toString().toLowerCase().includes('common brand')) return; // Header catch

                        if (pName) {
                            lastProductName = pName;
                        } else if (pBrand && pBrand !== "Loose / Fresh") {
                            pName = lastProductName;
                        }

                        if (!pName) return;

                        const hasPrice = pPriceRaw && pPriceRaw.length > 0;
                        // Only skip if IS header-ish and no price (strict check mostly for recurring headers)
                        if (!hasPrice && (pName === 'Product Name' || pName.includes('Category:'))) return;

                        const pPrice = hasPrice ? pPriceRaw.replace(/,/g, '').replace(/[^\d\.]/g, ' ').trim().split(/\s+/)[0] : "0";
                        const brandDisplay = pBrand.split(',')[0].split('/')[0].trim();

                        let displayName = pName;
                        if (!row[nameIdx] && pBrand !== "Loose / Fresh") {
                            displayName = `${pName} - ${brandDisplay}`;
                        }
                        if (pSpec) displayName += ` (${pSpec})`;

                        products.push({
                            baseName: displayName,
                            brand: brandDisplay,
                            image: null,
                            indicativePrice: pPrice || "0",
                            variantId: slugify(`${actualSheetName}_${displayName}_${brandDisplay}_${rowIdx}`)
                        });
                    });

                    console.log(`[CATALOG_LOADER] Loaded ${products.length} products for ${name}`);
                    return {
                        categoryId: slugify(name),
                        categoryName: name,
                        order: index,
                        products
                    };
                } catch (sheetErr) {
                    console.error(`[CATALOG_LOADER] Error parsing sheet ${actualSheetName}:`, sheetErr);
                }
            }

            return {
                categoryId: slugify(name),
                categoryName: name,
                order: index,
                products: []
            };
        });

        // Handle aggregation for 'All Categories'
        const allProducts = result.filter(c => !c._isAggregate).flatMap(c => c.products);
        result.forEach(c => {
            if (c._isAggregate) {
                // Return top products from all categories
                c.products = allProducts.slice(0, 100);
            }
            delete c._isAggregate; // Cleanup
        });

        return result;
    } catch (error) {
        console.error('[CATALOG_LOADER] Critical error in loadExcelCatalog:', error);
        return fallbackCatalog;
    }
}

// Keep loadGroceryCatalog as an alias for backward compatibility during migration
const loadGroceryCatalog = () => loadExcelCatalog('GROCERY_KIRANA');

module.exports = { loadExcelCatalog, loadGroceryCatalog, slugify };
