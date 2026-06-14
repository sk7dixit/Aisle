const { loadExcelCatalog } = require('../../../utils/catalogLoader');
const { searchProductImage } = require('../../googleImageService');

const searchProducts = async (query) => {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    try {
        console.log(`[ElectricalProvider] Loading catalog from Excel for query: "${term}"`);
        const catalog = loadExcelCatalog('ELECTRICAL_HARDWARE_AUTO');
        
        // Flatten all products from all categories
        const allProducts = [];
        catalog.forEach(cat => {
            cat.products.forEach(p => {
                allProducts.push({
                    name: p.baseName,
                    brand: p.brand || 'General',
                    category: cat.categoryId, // Keep the category slug
                    imageUrl: p.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
                    barcode: p.barcode || p.variantId,
                    externalId: p.variantId,
                    source: 'excel_electrical'
                });
            });
        });

        // If query is "general" or "all", return all products
        if (term === 'general' || term === 'all' || term === 'electrical_hardware_auto' || term === 'electronics_tools' || term.includes('electrical')) {
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
            const googleImg = await searchProductImage(`${item.brand} ${item.name}`);
            if (googleImg) {
                item.imageUrl = googleImg;
            }
            return item;
        }));

        return resolved;

    } catch (err) {
        console.error('[ElectricalProvider] Error resolving catalog:', err.message);
        return [];
    }
};

module.exports = {
    searchProducts
};
