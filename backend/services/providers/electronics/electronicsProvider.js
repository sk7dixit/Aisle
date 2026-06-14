const { loadExcelCatalog } = require('../../../utils/catalogLoader');
const { searchProductImage } = require('../../googleImageService');

const searchProducts = async (query) => {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    try {
        console.log(`[ElectronicsProvider] Loading catalog from Excel for query: "${term}"`);
        const catalog = loadExcelCatalog('TECH_ACCESSORIES');
        
        // Flatten all products from all categories
        const allProducts = [];
        catalog.forEach(cat => {
            cat.products.forEach(p => {
                allProducts.push({
                    name: p.baseName,
                    brand: p.brand || 'General',
                    category: cat.categoryId, // Keep the category slug
                    imageUrl: p.image || 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?placeholder=true&w=500',
                    barcode: p.barcode || p.variantId,
                    externalId: p.variantId,
                    source: 'excel_tech'
                });
            });
        });

        // If query is "general", "all", "tech_accessories", etc. return all products
        if (term === 'general' || term === 'all' || term === 'tech_accessories' || term === 'electronics' || term.includes('electronic')) {
            return allProducts;
        }

        // Filter based on search query
        const termCleaned = term.replace(/[^a-z0-9]/g, '');
        const filtered = allProducts.filter(item => {
            const name = item.name.toLowerCase();
            const brand = item.brand.toLowerCase();
            const cat = item.category.toLowerCase().replace(/[^a-z0-9]/g, '');
            return name.includes(term) || brand.includes(term) || cat.includes(termCleaned) || termCleaned.includes(cat);
        });

        // Resolve images asynchronously for the matched candidates (up to 12)
        const resolved = await Promise.all(filtered.slice(0, 12).map(async (item) => {
            // Only search if imageUrl is a placeholder
            if (!item.imageUrl || item.imageUrl.includes('placeholder')) {
                const googleImg = await searchProductImage(`${item.brand} ${item.name}`, { brand: item.brand });
                if (googleImg) {
                    item.imageUrl = googleImg;
                }
            }
            return item;
        }));

        return resolved;

    } catch (err) {
        console.error('[ElectronicsProvider] Error resolving catalog:', err.message);
        return [];
    }
};

module.exports = {
    searchProducts
};
