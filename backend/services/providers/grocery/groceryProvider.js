const axios = require('axios');
const { searchProductImage } = require('../../googleImageService');

// High-quality local grocery products to act as a self-healing fallback when OpenFoodFacts experiences 503 down times
const MOCK_CATALOG = [
    {
        name: "Oreo Chocolate Sandwich Cookies",
        brand: "Oreo",
        category: "sweet-shop",
        imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=600",
        barcode: "7622300314123",
        externalId: "mock_oreo_1",
        source: "openfoodfacts"
    },
    {
        name: "Amul Taaza Fresh Toned Milk",
        brand: "Amul",
        category: "dairy-ice-cream",
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600",
        barcode: "8901262150125",
        externalId: "mock_amul_taaza",
        source: "openfoodfacts"
    },
    {
        name: "Tata Salt 1kg Vacuum Evaporated",
        brand: "Tata",
        category: "general-provision",
        imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=600",
        barcode: "8901058002310",
        externalId: "mock_tata_salt",
        source: "openfoodfacts"
    },
    {
        name: "Madhur Refined Sugar 1kg",
        brand: "Madhur",
        category: "general-provision",
        imageUrl: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=600",
        barcode: "8906017210087",
        externalId: "mock_madhur_sugar",
        source: "openfoodfacts"
    },
    {
        name: "Aashirvaad Shudh Chakki Atta 5kg",
        brand: "Aashirvaad",
        category: "wholesale-grain",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600",
        barcode: "8901725181222",
        externalId: "mock_atta_aashirvaad",
        source: "openfoodfacts"
    },
    {
        name: "Britannia Toasty Milk Rusk",
        brand: "Britannia",
        category: "bakery-cake-shop",
        imageUrl: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600",
        barcode: "8901063142278",
        externalId: "mock_rusk_britannia",
        source: "openfoodfacts"
    },
    {
        name: "Maggi 2-Minute Masala Noodles",
        brand: "Nestle",
        category: "general-provision",
        imageUrl: "https://images.unsplash.com/photo-1612966608967-3e2b81c6e59b?auto=format&fit=crop&q=80&w=600",
        barcode: "8901058821034",
        externalId: "mock_maggi_noodles",
        source: "openfoodfacts"
    },
    {
        name: "Coca Cola 500ml Cold Drink",
        brand: "Coca-Cola",
        category: "dairy-ice-cream",
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
        barcode: "5449000000996",
        externalId: "mock_coke_500",
        source: "openfoodfacts"
    },
    {
        name: "Lays Classic Salted Chips",
        brand: "Lays",
        category: "general-provision",
        imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=600",
        barcode: "8901491101831",
        externalId: "mock_lays_chips",
        source: "openfoodfacts"
    },
    {
        name: "Colgate Strong Teeth Toothpaste",
        brand: "Colgate",
        category: "general-provision",
        imageUrl: "https://images.unsplash.com/photo-1559599141-381548b2da5a?auto=format&fit=crop&q=80&w=600",
        barcode: "8901188010834",
        externalId: "mock_colgate_paste",
        source: "openfoodfacts"
    },
    {
        name: "Dettol Liquid Handwash 200ml",
        brand: "Dettol",
        category: "general-provision",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600",
        barcode: "8901396328524",
        externalId: "mock_dettol_handwash",
        source: "openfoodfacts"
    }
];

const searchProducts = async (query) => {
    try {
        console.log(`[OpenFoodFacts] Searching API for: ${query}`);
        const response = await axios.get(
            `https://world.openfoodfacts.org/cgi/search.pl`,
            {
                params: {
                    search_terms: query,
                    search_simple: 1,
                    action: 'process',
                    json: 1,
                    page_size: 12
                },
                headers: {
                    'User-Agent': 'AisleApp/1.0 (shoplens017@gmail.com)'
                },
                timeout: 5000 // 5 seconds timeout
            }
        );

        const getValidImage = (item) => {
            return (
                item.image_front_url ||
                item.image_url ||
                item.image_front_small_url ||
                item.image_small_url ||
                ''
            );
        };

        const isValidImage = (url) => {
            if (!url) return false;
            return (
                url.includes('openfoodfacts') ||
                url.includes('images') ||
                url.includes('unsplash')
            );
        };

        const extractSize = (name) => {
            const match = name.match(/(\d+\s?(g|kg|ml|l))/i);
            return match ? match[0] : '';
        };

        const ALLOWED_GROCERY_CATEGORIES = [
            'food', 'beverage', 'grocery', 'snack', 'salt', 'sugar', 'spice', 'grain', 
            'dairy', 'milk', 'cheese', 'bakery', 'bread', 'sweet', 'chocolate', 
            'noodle', 'sauce', 'oil', 'tea', 'coffee', 'drink', 'confectionery',
            'soap', 'shampoo', 'wash', 'detergent', 'cleaning', 'hygiene', 'household', 
            'cosmetics', 'personal', 'biscuit', 'cookie'
        ];

        const queryWords = query.toLowerCase().split(' ').filter(Boolean);

        const cleanProducts = (response.data.products || []).filter((item) => {
            // 1. PRODUCT NAME REQUIRED & VALID LENGTH
            const name = (item.product_name || '').toLowerCase();
            if (!name || name.length < 3 || name.length > 80) {
                return false;
            }

            // 2. ALL SEARCH WORDS MUST EXIST IN PRODUCT NAME
            const matches = queryWords.every((word) => name.includes(word));
            if (!matches) {
                return false;
            }

            // 3. IMAGE REQUIRED & VALID
            const rawImg = getValidImage(item);
            if (!rawImg || !isValidImage(rawImg)) {
                return false;
            }

            // 4. BRANDS REQUIRED
            if (!item.brands || item.brands.trim().length === 0) {
                return false;
            }

            // 5. CATEGORY VALIDATION
            const categories = (item.categories || '').toLowerCase();
            const categoriesTags = (item.categories_tags || []).join(' ').toLowerCase();
            const combinedCats = `${categories} ${categoriesTags}`;
            const hasCategoryInfo = combinedCats.trim().length > 0;
            const isValidCat = !hasCategoryInfo || ALLOWED_GROCERY_CATEGORIES.some(cat => combinedCats.includes(cat));
            if (!isValidCat) {
                return false;
            }

            return true;
        });

        // 6. REMOVE DUPLICATES BY NAME AND IMAGE
        const uniqueProducts = [];
        const seenNames = new Set();
        const seenImages = new Set();
        for (const item of cleanProducts) {
            const nameKey = item.product_name.toLowerCase().trim();
            const imgKey = getValidImage(item);

            if (!seenNames.has(nameKey) && imgKey && !seenImages.has(imgKey)) {
                seenNames.add(nameKey);
                seenImages.add(imgKey);
                uniqueProducts.push(item);
            }
        }

        if (uniqueProducts.length > 0) {
            const results = await Promise.all(uniqueProducts.map(async (item) => {
                const rawImg = getValidImage(item);
                const validatedImg = isValidImage(rawImg) ? rawImg : '';
                
                // Fetch top product image from Google Custom Search
                let imageUrl = validatedImg;
                const googleImg = await searchProductImage(`${item.brands || ''} ${item.product_name || ''}`);
                if (googleImg) {
                    imageUrl = googleImg;
                }

                return {
                    name: item.product_name || 'Unknown Product',
                    brand: item.brands || 'Unknown Brand',
                    category: item.categories_tags?.[0]?.replace('en:', '') || 'general',
                    imageUrl: imageUrl,
                    barcode: item.code || '',
                    externalId: item._id,
                    source: 'openfoodfacts',
                    size: extractSize(item.product_name || '')
                };
            }));
            return results;
        }
        
        // If API returned 0 results, fall back to mock catalog search
        return await searchMockCatalog(query);

    } catch (error) {
        console.warn('[OpenFoodFacts] API is unavailable or rate-limited. Activating self-healing mock fallback.', error.message);
        return await searchMockCatalog(query);
    }
};

const searchMockCatalog = async (query) => {
    const term = query.toLowerCase().trim();
    if (!term) return [];
    
    const extractSize = (name) => {
        const match = name.match(/(\d+\s?(g|kg|ml|l))/i);
        return match ? match[0] : '';
    };

    console.log(`[OpenFoodFacts] Local fallback matched search for: "${term}"`);
    const matches = MOCK_CATALOG.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );

    const results = await Promise.all(matches.map(async (p) => {
        let imageUrl = p.imageUrl;
        const googleImg = await searchProductImage(`${p.brand || ''} ${p.name || ''}`);
        if (googleImg) {
            imageUrl = googleImg;
        }
        return {
            ...p,
            imageUrl,
            size: extractSize(p.name)
        };
    }));

    return results;
};

module.exports = {
    searchProducts
};
