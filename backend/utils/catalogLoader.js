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
        fileName: 'Electrical, Hardware & Auto.xlsx',
        categories: [
            "Electrical & Lighting",
            "Hardware & Furniture Fittings",
            "Plumbing & Sanitaryware",
            "Paints & Waterproofing",
            "Automobile Spares & Care",
            "Tools & Industrial Supply"
        ]
    },
    'TECH_ACCESSORIES': {
        fileName: 'Tech & Accessories.xlsx',
        categories: [
            "All Categories",
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
            "Allopathic Medicines",
            "Ayurvedic & Wellness",
            "Surgical, Rehab & General"
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

                    if (headerIndex === -1) {
                        return { categoryId: slugify(name), categoryName: name, order: index, products: [] };
                    }

                    const headers = rawRows[headerIndex];
                    let dataRows = rawRows.slice(headerIndex + 1);

                    // Single Sheet Section Filtering
                    if (config.singleSheetMode && !isAll) {
                        // Find start of section
                        let startIdx = -1;
                        let endIdx = dataRows.length;

                        // We look for a row that starts with "N. Category Name"
                        // The index is roughly (order within categories)
                        // But verifying by name is safer
                        const searchTerms = name.toLowerCase().split(/[&/]/).map(s => s.trim()).filter(s => s.length > 3);

                        for (let i = 0; i < dataRows.length; i++) {
                            const row = dataRows[i];
                            if (row && row.length > 0 && row[0] && typeof row[0] === 'string') {
                                const cellVal = row[0].toLowerCase();
                                // Check if it's a section header (starts with number dot)
                                if (cellVal.match(/^\d+\./)) {
                                    const match = searchTerms.some(term => cellVal.includes(term));
                                    if (match) {
                                        startIdx = i + 1; // Start AFTER the section header
                                    } else if (startIdx !== -1) {
                                        // We found a NEW section header after ours, so stop
                                        endIdx = i;
                                        break;
                                    }
                                }
                            }
                        }

                        if (startIdx !== -1) {
                            dataRows = dataRows.slice(startIdx, endIdx);
                        } else {
                            // If explicit section not found, fallback to empty or loose match?
                            // For now, if strict section mapping fails, return empty to prevent bleed
                            return { categoryId: slugify(name), categoryName: name, order: index, products: [] };
                        }
                    }

                    const findCol = (terms) => headers.findIndex(h => terms.some(t => h && h.toString().toLowerCase().includes(t.toLowerCase())));

                    const nameIdx = findCol(['product name', 'item name', 'brand / variety', 'variety', 'subject', 'details']);
                    const brandIdx = findCol(['brand', 'variety', 'type', 'famous', 'company']);
                    const specIdx = findCol(['weight', 'unit', 'specification', 'size', 'model', 'duration', 'frequency']);
                    const priceIdx = findCol(['price', 'market price', 'mrp', 'rate', 'fee']);

                    let lastProductName = "";
                    const products = [];

                    dataRows.forEach((row, rowIdx) => {
                        let pName = row[nameIdx];
                        const pBrand = row[brandIdx] || "Loose / Fresh";
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
