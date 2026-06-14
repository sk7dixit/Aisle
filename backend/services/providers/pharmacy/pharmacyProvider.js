const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

let cachedProducts = null;

const resolveImageUrl = (rawUrl) => {
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
    } catch (e) {
        // Ignore URL parse errors
    }
    return '';
};

const getBrandFromName = (name) => {
    if (!name) return 'Generic';
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const firstWord = cleanName.split(/\s+/)[0];
    if (firstWord && firstWord.length > 2) {
        return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
    return 'Generic';
};

const loadProductsFromExcel = () => {
    if (cachedProducts) return cachedProducts;

    try {
        const filePath = 's:\\Shoplens Proj\\Excel\\Pharmacy.xlsx';
        console.log(`[PharmacyProvider] Parsing products from Excel: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            console.error(`[PharmacyProvider] Excel file not found at: ${filePath}`);
            return [];
        }

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const products = [];

        for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length === 0) continue;

            const col0 = String(row[0] || '').trim();
            if (!col0) continue;

            // Check if this is a header row
            if (col0 === 'Allopathic Medicines' || col0 === 'Ayurvedic & Wellness' || col0 === 'Surgical, Rehab & General') {
                continue;
            }

            // Determine category based on row index
            let category = 'surgical-equipment';
            if (i > 0 && i < 86) {
                category = 'allopathic-chemist';
            } else if (i > 86 && i < 157) {
                category = 'ayurvedic-herbal';
            } else if (i > 157) {
                category = 'surgical-equipment';
            }

            // Extract image/redirect URL
            const rawUrl = String(row[3] || '').trim();
            const imageUrl = resolveImageUrl(rawUrl);

            const brand = getBrandFromName(col0);
            const externalId = `excel_pharm_${category}_${i}`;
            const barcode = `8903${String(i).padStart(9, '0')}`;

            products.push({
                name: col0,
                brand,
                category,
                imageUrl: imageUrl || 'https://via.placeholder.com/150',
                source: 'pharmacy-excel',
                barcode,
                externalId
            });
        }

        console.log(`[PharmacyProvider] Successfully loaded ${products.length} products from Excel.`);
        cachedProducts = products;
        return products;
    } catch (err) {
        console.error('[PharmacyProvider] Failed to load/parse Pharmacy.xlsx:', err.message);
        return [];
    }
};

const searchProducts = async (query) => {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    const products = loadProductsFromExcel();

    if (term === 'general' || term === 'all') {
        return products;
    }

    const termCleaned = term.replace(/[^a-z0-9]/g, '');
    return products.filter(item => {
        const name = item.name.toLowerCase();
        const brand = item.brand.toLowerCase();
        const cat = item.category.toLowerCase().replace(/[^a-z0-9]/g, '');
        return name.includes(term) || brand.includes(term) || cat.includes(termCleaned) || termCleaned.includes(cat);
    });
};

module.exports = {
    searchProducts
};
