const axios = require('axios');

const STATIC_LIFESTYLE = [
    {
        name: 'Scented Soy Wax Candle',
        brand: 'Generic',
        category: 'furnishing-decor',
        imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600',
        source: 'local-lifestyle',
        barcode: '8901058500001',
        externalId: 'mock_life_candle'
    },
    {
        name: 'Classic Leather Wallet',
        brand: 'Generic',
        category: 'bags-luggage',
        imageUrl: 'https://images.unsplash.com/photo-1627124718414-037f7736e612?auto=format&fit=crop&q=80&w=600',
        source: 'local-lifestyle',
        barcode: '8901058500002',
        externalId: 'mock_life_wallet'
    }
];

const searchProducts = async (query) => {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    try {
        console.log(`[LifestyleProvider] Fetching dynamic products for query: "${term}"`);
        const response = await axios.get('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json', { timeout: 3000 });
        const allProducts = response.data || [];
        
        // Filter for Home & Kitchen and Fashion & Apparel
        const apiProducts = allProducts.filter(p => 
            p.category === 'Home & Kitchen' || p.category === 'Fashion & Apparel'
        );

        // Map to Shoplens schema
        const mappedProducts = apiProducts.map(item => {
            const sub = (item.subCategory || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            let aisleCat = 'furnishing-decor';
            
            if (cat.includes('kitchen') || sub.includes('kitchen') || sub.includes('cookware') || sub.includes('dining')) {
                aisleCat = 'kitchenware-cookware';
            } else if (sub.includes('shoes') || sub.includes('footwear') || sub.includes('sneakers')) {
                aisleCat = 'footwear';
            } else if (sub.includes('bags') || sub.includes('luggage') || sub.includes('backpack') || sub.includes('wallet')) {
                aisleCat = 'bags-luggage';
            } else if (cat.includes('fashion') || sub.includes('clothing') || sub.includes('apparel') || sub.includes('garments')) {
                aisleCat = 'clothing-garments';
            } else if (sub.includes('cleaning') || sub.includes('plastics') || sub.includes('storage')) {
                aisleCat = 'plastics-cleaning';
            } else if (sub.includes('toys') || sub.includes('sports') || sub.includes('gifts')) {
                aisleCat = 'toys-sports';
            }

            return {
                name: item.name,
                brand: item.keywords?.[0] || 'Generic',
                category: aisleCat,
                imageUrl: item.image,
                source: 'free-ecommerce-api',
                barcode: `8905${String(item.id).padStart(9, '0')}`,
                externalId: `api_${item.id}`,
                description: item.description,
                size: ''
            };
        });

        // Combine static and dynamic lists
        const combined = [...STATIC_LIFESTYLE, ...mappedProducts];
        
        // Filter based on query
        if (term === 'general' || term === 'all') {
            return combined;
        }

        const termCleaned = term.replace(/[^a-z0-9]/g, '');
        return combined.filter(item => {
            const name = item.name.toLowerCase();
            const brand = item.brand.toLowerCase();
            const cat = item.category.toLowerCase().replace(/[^a-z0-9]/g, '');
            return name.includes(term) || brand.includes(term) || cat.includes(termCleaned) || termCleaned.includes(cat);
        });

    } catch (err) {
        console.warn('[LifestyleProvider] Failed to fetch dynamic API (using static fallback):', err.message);
        
        if (term === 'general' || term === 'all') {
            return STATIC_LIFESTYLE;
        }

        const termCleaned = term.replace(/[^a-z0-9]/g, '');
        return STATIC_LIFESTYLE.filter(item => {
            const name = item.name.toLowerCase();
            const brand = item.brand.toLowerCase();
            const cat = item.category.toLowerCase().replace(/[^a-z0-9]/g, '');
            return name.includes(term) || brand.includes(term) || cat.includes(termCleaned) || termCleaned.includes(cat);
        });
    }
};

module.exports = {
    searchProducts
};
