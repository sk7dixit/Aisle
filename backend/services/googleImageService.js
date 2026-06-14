const axios = require('axios');
const ProductImageCache = require('../models/ProductImageCache');

const LOCAL_IMAGE_FALLBACK = [
    { keys: ['salt', 'namak'], url: 'https://images.unsplash.com/photo-1610431888041-ad37a68e3514?w=500&fit=crop&q=80' },
    { keys: ['toothpaste', 'dant', 'colgate', 'pepsodent'], url: 'https://images.unsplash.com/photo-1559599141-381548b2da5a?w=500&fit=crop&q=80' },
    { keys: ['handwash', 'hand wash', 'sanitizer', 'dettol'], url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&fit=crop&q=80' },
    { keys: ['detergent', 'surf excel', 'powder', 'washing'], url: 'https://images.unsplash.com/photo-1610555356070-d0efb6505f81?w=500&fit=crop&q=80' },
    { keys: ['dishwash', 'vim', 'dish wash', 'scrub'], url: 'https://images.unsplash.com/photo-1607006342465-b778216335ab?w=500&fit=crop&q=80' },
    { keys: ['floor cleaner', 'lizol', 'cleaner'], url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&fit=crop&q=80' },
    { keys: ['toilet cleaner', 'harpic'], url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&fit=crop&q=80' },
    { keys: ['atta', 'flour', 'wheat', 'suji', 'maida'], url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&fit=crop&q=80' },
    { keys: ['oil', 'mustard', 'soyabean', 'fortune'], url: 'https://images.unsplash.com/photo-1474979266404-7eaacbadcbaf?w=500&fit=crop&q=80' },
    { keys: ['spice', 'masala', 'garam', 'everest', 'mdh', 'pepper', 'black pepper'], url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&fit=crop&q=80' },
    { keys: ['noodle', 'maggi', 'pasta'], url: 'https://images.unsplash.com/photo-1612929633738-8fe9307f154d?w=500&fit=crop&q=80' },
    { keys: ['jam', 'kissan'], url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&fit=crop&q=80' },
    { keys: ['tea', 'chai', 'green tea'], url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&fit=crop&q=80' },
    { keys: ['coffee', 'nescafe'], url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&fit=crop&q=80' },
    { keys: ['shampoo', 'clinic plus', 'dove'], url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&fit=crop&q=80' },
    { keys: ['soap', 'lux', 'lifebuoy', 'pears'], url: 'https://images.unsplash.com/photo-1607006342465-b778216335ab?w=500&fit=crop&q=80' },
    { keys: ['ketchup', 'sauce'], url: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?w=500&fit=crop&q=80' },
    { keys: ['chocolate', 'cadbury', 'dairymilk'], url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&fit=crop&q=80' },
    { keys: ['ghee', 'butter', 'amul'], url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&fit=crop&q=80' },
    { keys: ['rice', 'basmati', 'dubar', 'india gate'], url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&fit=crop&q=80' },
    { keys: ['medicine', 'tablet', 'capsule', 'pill', 'dolo', 'crocin', 'calpol', 'paracip', 'combiflam', 'brufen', 'flexon', 'gelusil', 'digene'], url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&fit=crop&q=80' },
    { keys: ['ayurvedic', 'herbal', 'wellness', 'chyawanprash', 'honey', 'ashwagandha', 'giloy', 'amla', 'juice', 'organic'], url: 'https://images.unsplash.com/photo-1611070973770-b1a672610041?w=500&fit=crop&q=80' },
    { keys: ['surgical', 'mask', 'gloves', 'thermometer', 'support', 'bandage', 'bandages', 'tape', 'shield', 'pump', 'kit', 'equipment', 'condom', 'condoms', 'jelly', 'sanitizer', 'swab', 'alcohol', 'strip', 'strips', 'glucometer', 'lancing', 'bp', 'monitor', 'nebulizer', 'vaporizer', 'scale', 'weighing', 'needle', 'syringe', 'cotton', 'gauze', 'pad', 'pads', 'plaster', 'plasters', 'spray', 'sprays', 'gel', 'ointment', 'antiseptic', 'diaper', 'diapers', 'wipes', 'napkin', 'napkins', 'band-aid', 'bandaid'], url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&fit=crop&q=80' },
    { keys: ['airpods', 'earbuds', 'headphone', 'headphones', 'earphone', 'earphones', 'neckband'], url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&fit=crop&q=80' },
    { keys: ['watch', 'smartwatch', 'band', 'colorfit'], url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&fit=crop&q=80' },
    { keys: ['laptop', 'notebook', 'macbook', 'omen', 'victus', 'pavilion', 'thinkpad', 'yoga', 'inspiron', 'vostro', 'zenbook', 'vivobook', 'swift', 'aspire', 'predator', 'nitro'], url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&fit=crop&q=80' },
    { keys: ['mouse', 'trackpad'], url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&fit=crop&q=80' },
    { keys: ['keyboard'], url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&fit=crop&q=80' },
    { keys: ['router', 'modem', 'wifi'], url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&fit=crop&q=80' },
    { keys: ['monitor', 'screen', 'display'], url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&fit=crop&q=80' },
    { keys: ['printer', 'scanner'], url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&fit=crop&q=80' },
    { keys: ['tablet', 'ipad'], url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&fit=crop&q=80' },
    { keys: ['iphone', 'galaxy', 'pixel', 'moto', 'oneplus', 'redmi', 'realme', 'vivo', 'oppo', 'samsung'], url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&fit=crop&q=80' }
];

const getLocalFallbackImage = (query, category = '') => {
    const q = query.toLowerCase();
    
    // First, check query keywords
    for (const item of LOCAL_IMAGE_FALLBACK) {
        if (item.keys.some(k => q.includes(k))) {
            return item.url;
        }
    }
    
    // Check if category matches
    const cat = (category || '').toLowerCase();
    if (cat.includes('allopathic') || cat.includes('chemist') || cat.includes('medicine') || cat.includes('pharmacy')) {
        return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&fit=crop&q=80';
    }
    if (cat.includes('ayurvedic') || cat.includes('herbal') || cat.includes('wellness')) {
        return 'https://images.unsplash.com/photo-1611070973770-b1a672610041?w=500&fit=crop&q=80';
    }
    if (cat.includes('surgical') || cat.includes('equipment') || cat.includes('rehab')) {
        return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&fit=crop&q=80';
    }
    if (cat.includes('mobiles') || cat.includes('audio') || cat.includes('wearables') || cat.includes('tech')) {
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&fit=crop&q=80';
    }
    if (cat.includes('computers') || cat.includes('gaming') || cat.includes('office') || cat.includes('electronics')) {
        return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&fit=crop&q=80';
    }
    
    return '';
};

/**
 * Intelligently extracts core keywords from a raw product query input
 */
const extractProductKeywords = (rawInput) => {
    if (!rawInput) return { cleanName: '', brand: '', size: '', keywords: [] };

    // 1. Convert to string and clean special characters (keep alphanumeric, space, dot, and g/kg weight signs)
    let cleaned = rawInput.toString()
        .replace(/[\(\)\[\]\{\}\-\+\:\,\'\"]/g, ' ') // Replace punctuation with space
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Identify and extract weight/size/quantity
    const sizeRegex = /(\d+(\.\d+)?\s*(g|kg|ml|l|ltr|oz|kgm|gm|tablet|cap|pcs|piece|packet|pack|sachets|serving|kg|ml|l|ltr)s?\b)/gi;
    const sizes = cleaned.match(sizeRegex) || [];
    const sizeStr = sizes.length > 0 ? sizes[0].trim() : '';

    // Remove sizes from the name to isolate product words
    if (sizeStr) {
        cleaned = cleaned.replace(sizeRegex, ' ');
    }

    // 3. Remove standard noisy stop words
    const noisePatterns = [
        /\bpack of \d+\b/gi,
        /\b(pack of|pcs|pieces|buy|get|free|with|promo|special offer|discount|combo|offer|new|imported|best|deal|fresh|premium|quality|famous|variety|specifications?|specification|model|duration|frequency|mrp|rate|fee|market price|price|loose|fresh|evaporated|vacuum)\b/gi
    ];

    noisePatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });

    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 4. Intelligently extract Brand and Core Product Type
    const words = cleaned.split(/\s+/).filter(w => w.length > 1);
    
    let brand = '';
    let productType = '';
    
    if (words.length > 0) {
        brand = words[0]; // Simple brand assumption
        productType = words.slice(1).join(' ');
        
        // Handle common compound brands (e.g., Coca Cola, Surf Excel, Mother Dairy)
        if (words.length > 1 && ['coca', 'surf', 'red', 'dark', 'mother', 'head', 'paper'].includes(words[0].toLowerCase())) {
            brand = `${words[0]} ${words[1]}`;
            productType = words.slice(2).join(' ');
        }
    } else {
        brand = '';
        productType = cleaned;
    }

    // Generate isolated key terms
    const keywords = [];
    if (brand) keywords.push(brand);
    
    const productTypeTokens = productType.split(/\s+/).filter(w => w.length > 2);
    keywords.push(...productTypeTokens);
    if (sizeStr) keywords.push(sizeStr);

    return {
        cleanName: cleaned,
        brand,
        size: sizeStr,
        keywords: keywords.filter((v, i, a) => a.indexOf(v) === i) // Deduplicate
    };
};

/**
 * Generate optimized search queries based on extracted product properties
 */
const generateSearchQueries = (brand, cleanName, size, category = '') => {
    const queries = [];
    const cat = category.toLowerCase();
    
    const isSeasonalOrApparel = cat.includes('festive') || cat.includes('festival') || cat.includes('cracker') || cat.includes('firework') || cat.includes('winter') || cat.includes('rain') || cat.includes('apparel') || cat.includes('clothing') || cat.includes('gear');
    
    if (isSeasonalOrApparel) {
        let base = `${brand || ''} ${cleanName}`.trim();
        if (size) base += ` ${size}`;
        
        queries.push(`${base} product white background`);
        queries.push(`${base} product image`);
        queries.push(`${base} on white background`);
    } else {
        // Query 1: The full brand + clean product name + size packaging
        if (size) {
            queries.push(`${brand} ${cleanName} ${size} product packaging`);
            queries.push(`${brand} ${cleanName} ${size} grocery packet`);
        } else {
            queries.push(`${brand} ${cleanName} product packaging`);
            queries.push(`${brand} ${cleanName} grocery pack`);
        }
        
        // Query 2: Pure brand + product name packaging (in case size query is too narrow)
        queries.push(`${brand} ${cleanName} package front`);
    }

    // Deduplicate queries
    return [...new Set(queries)];
};

/**
 * Score a single image result item based on relevance and anti-lifestyle filters
 */
const scoreImageItem = (item, keywords, brand, cleanName) => {
    const url = (item.link || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const snippet = (item.snippet || '').toLowerCase();

    // 1. Extreme negative filters to avoid lifestyle images, recipes, cooking blogs
    const badTerms = [
        'recipe', 'blog', 'restaurant', 'cooking', 'cooked', 'dish', 'plate', 'serving',
        'table', 'glass', 'kitchen', 'grill', 'chef', 'pinterest', 'instagram', 'facebook',
        'youtube', 'lifestyle', 'diner', 'dining', 'meal', 'delicious', 'preparation', 'prepped',
        'how to make', 'background', 'wallpaper', 'exif', 'shutterstock', 'stock photo',
        'istockphoto', 'stock-photo', 'alamy', 'dreamstime', 'vector', 'illustration', 'clipart',
        'cartoon', 'drawing', 'template', 'mockup', 'mockuppsd', 'psd', 'freebie'
    ];

    if (badTerms.some(term => url.includes(term) || title.includes(term) || snippet.includes(term))) {
        return { score: -100, isExcluded: true };
    }

    // Filter out generic files
    if (url.endsWith('.svg') || url.includes('/logo/') || url.includes('/logos/')) {
        return { score: -50, isExcluded: true };
    }

    let score = 0;

    // 2. High-quality e-commerce and grocery sources
    const grocerySources = [
        'bigbasket', 'blinkit', 'jiomart', 'instamart', 'amazon', 'flipkart', 'grocery', 
        'mart', 'supermarket', 'quickcommerce', 'store', 'cart', 'buy', 'online', 
        'nykaa', 'purplle', 'zepto', 'dmart', 'spencers', 'naturebasket'
    ];
    grocerySources.forEach(term => {
        if (url.includes(term)) score += 35;
        if (title.includes(term)) score += 15;
    });

    // 3. Packaging indicator keywords
    const packagingKeywords = [
        'pack', 'pouch', 'packet', 'packaging', 'front', 'label', 'bottle', 
        'can', 'box', 'wrapper', 'mrp', 'tub', 'tube', 'jar', 'carton'
    ];
    packagingKeywords.forEach(term => {
        if (url.includes(term)) score += 25;
        if (title.includes(term)) score += 15;
        if (snippet.includes(term)) score += 10;
    });

    // 4. Core brand match boost (Brand is critical!)
    if (brand && brand.length > 1) {
        const lowerBrand = brand.toLowerCase();
        if (title.includes(lowerBrand)) score += 50;
        if (url.includes(lowerBrand)) score += 30;
        if (snippet.includes(lowerBrand)) score += 15;
    }

    // 5. Keyword match ratio
    let matchedKeywords = 0;
    keywords.forEach(kw => {
        const lowerKw = kw.toLowerCase();
        if (brand && lowerKw === brand.toLowerCase()) return; // Already boosted brand
        if (title.includes(lowerKw)) {
            score += 20;
            matchedKeywords++;
        }
        if (url.includes(lowerKw)) {
            score += 10;
        }
    });

    // Boost if multiple keywords matched
    if (matchedKeywords === keywords.length - 1 && keywords.length > 2) {
        score += 30; // Excellent match boost
    }

    // 6. Visual dimensions rating
    if (item.image) {
        const width = item.image.width || 0;
        const height = item.image.height || 0;
        
        // Prefer square or slightly vertical/horizontal aspect ratios (standard product shots)
        if (width > 0 && height > 0) {
            const ratio = width / height;
            if (ratio >= 0.8 && ratio <= 1.25) {
                score += 20; // Near-square aspect ratio bonus
            } else if (ratio < 0.5 || ratio > 2.0) {
                score -= 30; // Extreme rectangular images are bad
            }
            
            // Prefer medium to high resolution
            if (width >= 300 && width <= 1500) {
                score += 15;
            }
        }
    }

    return { score, isExcluded: false };
};

const getGenericUnsplashKeyword = (cleanName) => {
    const q = cleanName.toLowerCase();
    
    // Salt & Sugar
    if (q.includes('salt')) return 'table salt';
    if (q.includes('sugar')) return 'white sugar bag';
    
    // Oral Care / Personal Care
    if (q.includes('toothpaste') || q.includes('oral care')) return 'toothpaste';
    if (q.includes('handwash') || q.includes('hand wash')) return 'liquid soap';
    if (q.includes('shampoo')) return 'shampoo bottle';
    if (q.includes('soap')) return 'bathing soap bar';
    if (q.includes('shaving') || q.includes('foam')) return 'shaving cream';
    
    // Cleaners & Detergents
    if (q.includes('detergent')) return 'washing powder';
    if (q.includes('dishwash') || q.includes('vim')) return 'dishwashing liquid';
    if (q.includes('floor cleaner') || q.includes('lizol')) return 'cleaning spray';
    if (q.includes('toilet cleaner') || q.includes('harpic')) return 'cleaning bottle';
    if (q.includes('fabric conditioner') || q.includes('comfort')) return 'fabric softener';
    
    // Fruits
    if (q.includes('apple')) return 'red apples';
    if (q.includes('banana')) return 'bananas';
    if (q.includes('mango')) return 'mango fruit';
    if (q.includes('orange') || q.includes('citrus')) return 'oranges';
    if (q.includes('grape')) return 'grapes';
    if (q.includes('lemon') || q.includes('nimboo')) return 'fresh lemons';
    if (q.includes('fruit')) return 'fresh fruits';
    
    // Vegetables
    if (q.includes('potato') || q.includes('aloo')) return 'potatoes';
    if (q.includes('onion') || q.includes('kanda')) return 'red onions';
    if (q.includes('tomato') || q.includes('tamatar')) return 'tomatoes';
    if (q.includes('ginger') || q.includes('adrak')) return 'fresh ginger';
    if (q.includes('garlic') || q.includes('lahsun')) return 'garlic bulbs';
    if (q.includes('coriander') || q.includes('kothmir')) return 'cilantro coriander';
    if (q.includes('vegetable')) return 'fresh vegetables';
    
    // Dairy & Ice Cream
    if (q.includes('milk')) return 'milk bottle';
    if (q.includes('cheese')) return 'cheese blocks';
    if (q.includes('paneer')) return 'cottage cheese';
    if (q.includes('butter')) return 'butter block';
    if (q.includes('dahi') || q.includes('curd') || q.includes('yogurt')) return 'yogurt cup';
    if (q.includes('lassi') || q.includes('buttermilk')) return 'lassi drink';
    if (q.includes('ice cream')) return 'ice cream tub';
    
    // Bakery & Cake Shop
    if (q.includes('brown bread')) return 'brown bread';
    if (q.includes('wheat bread') || q.includes('atta bread')) return 'whole wheat bread';
    if (q.includes('bread') || q.includes('pav') || q.includes('bun')) return 'sliced bread';
    if (q.includes('rusk')) return 'crispy rusks';
    if (q.includes('cake') || q.includes('lava cake') || q.includes('slice')) return 'chocolate cake';
    
    // Sweets (Mithai & Farsan)
    if (q.includes('kaju katli')) return 'indian cashew sweets';
    if (q.includes('ladoo') || q.includes('laddu') || q.includes('motichoor')) return 'ladoo sweet';
    if (q.includes('rasgulla')) return 'rasgulla sweet';
    if (q.includes('gulab jamun')) return 'gulab jamun sweet';
    if (q.includes('soan papdi')) return 'soan papdi sweet';
    if (q.includes('sweet') || q.includes('mithai')) return 'indian sweets';
    if (q.includes('namkeen') || q.includes('farsan') || q.includes('mathri')) return 'indian snacks namkeen';
    
    // Dry Fruits & Spices
    if (q.includes('almond') || q.includes('badam')) return 'almonds';
    if (q.includes('cashew') || q.includes('kaju')) return 'cashew nuts';
    if (q.includes('pistachio') || q.includes('pista')) return 'pistachios';
    if (q.includes('dry fruit') || q.includes('walnut') || q.includes('raisin')) return 'mixed nuts';
    if (q.includes('garam masala') || q.includes('spices') || q.includes('masala') || q.includes('powder')) return 'indian spices';
    
    // Oils
    if (q.includes('mustard oil')) return 'mustard oil bottle';
    if (q.includes('soyabean oil')) return 'soybean oil';
    if (q.includes('olive oil')) return 'olive oil bottle';
    if (q.includes('oil')) return 'cooking oil bottle';
    if (q.includes('ghee')) return 'ghee jar';
    
    // Noodles & Sauces
    if (q.includes('noodle') || q.includes('maggi') || q.includes('ramen')) return 'ramen noodles';
    if (q.includes('pasta') || q.includes('macaroni')) return 'uncooked pasta';
    if (q.includes('jam')) return 'fruit jam jar';
    if (q.includes('ketchup') || q.includes('sauce') || q.includes('tomato sauce')) return 'tomato ketchup bottle';
    
    // Beverages
    if (q.includes('green tea')) return 'green tea bag';
    if (q.includes('tea bag') || q.includes('tea powder') || q.includes('chai')) return 'tea bags';
    if (q.includes('coffee')) return 'coffee jar';
    if (q.includes('honey')) return 'honey jar';
    
    // Sweets & Chocolates
    if (q.includes('chocolate') || q.includes('cocoa')) return 'chocolate bar';
    
    // Wholesale / Grains
    if (q.includes('atta') || q.includes('flour') || q.includes('wheat')) return 'wheat flour';
    if (q.includes('rice') || q.includes('basmati')) return 'rice grains';
    if (q.includes('dal') || q.includes('gram') || q.includes('pulse') || q.includes('chana') || q.includes('urad') || q.includes('moong')) return 'lentils pulses';
    
    return 'aesthetic product';
};

// Rate-limiting exhaustion cache flags to bypass useless network requests after limits are reached
let isUnsplashExhausted = false;
let isGoogleExhausted = false;

/**
 * Direct search integration for Unsplash Developer API with orientation and keyword weighting
 */
const queryUnsplashImage = async (brand, cleanName, size, keywords) => {
    try {
        if (!process.env.UNSPLASH_ACCESS_KEY) {
            console.log(`[GoogleImageService] Unsplash Access Key is missing from config. Skipping.`);
            return null;
        }

        if (isUnsplashExhausted) {
            console.log(`[GoogleImageService] Unsplash API is marked as exhausted. Skipping network request.`);
            return null;
        }

        // Try primary query first (specific brand + product type)
        let primaryQuery = `${brand} ${cleanName}`.trim();
        const lowerBrand = brand ? brand.toLowerCase() : '';
        const genericBrands = ['fresh farms', 'premium fruit', 'ratnagiri', 'loose wholesale', 'dryfruit premium', 'fresh', 'traditional', 'loose', 'wholesale'];
        if (genericBrands.includes(lowerBrand)) {
            primaryQuery = cleanName;
        }

        console.log(`[GoogleImageService] Querying Unsplash Search API (Primary): "${primaryQuery}"`);

        let response = await axios.get('https://api.unsplash.com/search/photos', {
            params: {
                client_id: process.env.UNSPLASH_ACCESS_KEY,
                query: primaryQuery,
                per_page: 10,
                orientation: 'squarish'
            },
            timeout: 5000
        });

        let results = response.data.results || [];
        
        // If 0 results, fallback instantly to clean generic search keyword
        if (results.length === 0) {
            const genericKeyword = getGenericUnsplashKeyword(cleanName);
            console.log(`[GoogleImageService] Specific Unsplash search returned 0 results. Trying Generic keyword fallback: "${genericKeyword}"`);
            
            response = await axios.get('https://api.unsplash.com/search/photos', {
                params: {
                    client_id: process.env.UNSPLASH_ACCESS_KEY,
                    query: genericKeyword,
                    per_page: 10,
                    orientation: 'squarish'
                },
                timeout: 5000
            });
            results = response.data.results || [];
        }

        if (results.length === 0) {
            console.log(`[GoogleImageService] Unsplash search failed completely (0 results for primary and generic fallback)`);
            return null;
        }

        // Score Unsplash items based on brand / keyword matches
        const scoredItems = results.map(item => {
            const desc = (item.description || '').toLowerCase();
            const altDesc = (item.alt_description || '').toLowerCase();
            const tagStr = (item.tags || []).map(t => (t.title || '').toLowerCase()).join(' ');
            
            const combinedText = `${desc} ${altDesc} ${tagStr}`;
            
            let isExcluded = false;
            let score = 0;

            // Brand Match (very high boost!)
            if (brand && brand.length > 1) {
                const lowerBrand = brand.toLowerCase();
                if (combinedText.includes(lowerBrand)) score += 60;
            }

            // Keyword match ratio
            keywords.forEach(kw => {
                const lowerKw = kw.toLowerCase();
                if (brand && lowerKw === brand.toLowerCase()) return;
                if (combinedText.includes(lowerKw)) score += 20;
            });

            const url = item.urls.small || item.urls.regular || item.urls.thumb;
            return { url, score, isExcluded };
        });

        // Filter and sort
        const validItems = scoredItems
            .filter(si => !si.isExcluded)
            .sort((a, b) => b.score - a.score);

        if (validItems.length > 0) {
            console.log(`[GoogleImageService] Selected best Unsplash image with score ${validItems[0].score}: "${validItems[0].url}"`);
            return validItems[0].url;
        }

        return results[0].urls.small;

    } catch (err) {
        console.warn(`[GoogleImageService] Unsplash Search API query failed:`, err.message);
        if (err.response && (err.response.status === 403 || err.response.status === 401 || err.response.status === 429)) {
            console.log(`[GoogleImageService] Unsplash quota or auth issue (status ${err.response.status}). Marking Unsplash as exhausted.`);
            isUnsplashExhausted = true;
        }
        return null;
    }
};

/**
 * Direct search integration for Google Custom Search API
 */
const queryGoogleSearch = async (brand, cleanName, size, keywords, category = '') => {
    try {
        if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CX) {
            console.log(`[GoogleImageService] Google API Key or CX is missing. Skipping.`);
            return null;
        }

        if (isGoogleExhausted) {
            console.log(`[GoogleImageService] Google Custom Search API is marked as exhausted. Skipping network request.`);
            return null;
        }

        const searchQueries = generateSearchQueries(brand, cleanName, size, category);
        let finalSelectedImage = null;
        let bestScore = -999;

        for (const optimizedQuery of searchQueries) {
            try {
                console.log(`[GoogleImageService] Executing Google API query: "${optimizedQuery}"`);
                const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
                    params: {
                        key: process.env.GOOGLE_API_KEY,
                        cx: process.env.GOOGLE_CX,
                        q: optimizedQuery,
                        searchType: 'image',
                        num: 10
                    },
                    timeout: 5000
                });

                const items = response.data.items || [];
                if (items.length === 0) continue;

                // Score results
                const scoredItems = items.map(item => {
                    const { score, isExcluded } = scoreImageItem(item, keywords, brand, cleanName);
                    return { item, score, isExcluded };
                });

                const validItems = scoredItems
                    .filter(si => !si.isExcluded)
                    .sort((a, b) => b.score - a.score);

                if (validItems.length > 0) {
                    const topItem = validItems[0];
                    if (topItem.score > bestScore) {
                        bestScore = topItem.score;
                        finalSelectedImage = topItem.item.link;
                    }
                    if (topItem.score >= 80) break;
                }
            } catch (queryErr) {
                console.warn(`[GoogleImageService] Google Search API error for query "${optimizedQuery}":`, queryErr.message);
                if (queryErr.response && (queryErr.response.status === 429 || queryErr.response.status === 403)) {
                    console.log(`[GoogleImageService] Google API limit hit (status ${queryErr.response.status}). Marking Google as exhausted.`);
                    isGoogleExhausted = true;
                    break;
                }
            }
        }

        return finalSelectedImage;
    } catch (err) {
        console.warn(`[GoogleImageService] Google Custom Search query failed:`, err.message);
        return null;
    }
};

/**
 * Searches the image API using intelligent keyword extraction, ranking, and DB caching
 */
const searchProductImage = async (query, options = {}) => {
    try {
        const trimmedQuery = (query || '').trim();
        if (!trimmedQuery) return '';

        // 1. QUERY CACHE SYSTEM FIRST
        console.log(`[GoogleImageService] Checking MongoDB cache for query: "${trimmedQuery.toLowerCase()}"`);
        const cached = await ProductImageCache.findOne({ rawQuery: trimmedQuery });
        if (cached && cached.imageUrl) {
            console.log(`[GoogleImageService] MongoDB Cache Hit! Returning: "${cached.imageUrl}"`);
            return cached.imageUrl;
        }

        // 2. INTELLIGENT KEYWORD EXTRACTION
        const { cleanName, brand: extBrand, size, keywords } = extractProductKeywords(trimmedQuery);
        const brand = options.brand || extBrand;
        const category = options.category || '';
        
        console.log(`[GoogleImageService] Extracted properties -> Brand: "${brand}", Name: "${cleanName}", Size: "${size}", Category: "${category}"`);
        console.log(`[GoogleImageService] Core Keywords:`, keywords);

        if (keywords.length === 0) {
            console.log(`[GoogleImageService] Keyword extraction returned empty.`);
            return '';
        }

        // Determine engine preference based on category
        const isFreshCategory = ['fruits & vegetables', 'dairy & ice cream', 'bakery & cake shop', 'sweet shop (mithai & farsan)'].includes(category.toLowerCase());
        
        let resolvedImage = null;
        let sourceUsed = '';

        if (isFreshCategory) {
            // UNPLASH-FIRST PIPELINE
            console.log(`[GoogleImageService] Fresh category detected: "${category}". Using Unsplash-first pipeline.`);
            resolvedImage = await queryUnsplashImage(brand, cleanName, size, keywords);
            if (resolvedImage) {
                sourceUsed = 'unsplash-search';
            } else {
                console.log(`[GoogleImageService] Unsplash failed for fresh product. Trying Google Custom Search fallback...`);
                resolvedImage = await queryGoogleSearch(brand, cleanName, size, keywords, category);
                if (resolvedImage) sourceUsed = 'google-search';
            }
        } else {
            // GOOGLE-FIRST PIPELINE (Branded packets)
            console.log(`[GoogleImageService] Branded/Packaged category: "${category || 'General'}". Using Google-first pipeline.`);
            resolvedImage = await queryGoogleSearch(brand, cleanName, size, keywords, category);
            if (resolvedImage) {
                sourceUsed = 'google-search';
            } else {
                console.log(`[GoogleImageService] Google Search failed or exhausted. Trying Unsplash search fallback...`);
                resolvedImage = await queryUnsplashImage(brand, cleanName, size, keywords);
                if (resolvedImage) sourceUsed = 'unsplash-search';
            }
        }

        // 3. FINAL RESORT STATIC FALLBACK (IF BOTH APIs FAIL OR ARE EXHAUSTED)
        if (!resolvedImage) {
            console.log(`[GoogleImageService] All APIs failed for "${trimmedQuery}". Attempting static local fallback...`);
            const fallback = getLocalFallbackImage(trimmedQuery, category);
            if (fallback) {
                console.log(`[GoogleImageService] Last-resort Static Fallback hit: "${fallback}"`);
                resolvedImage = fallback;
                sourceUsed = 'static-fallback';
            } else {
                const cat = (category || '').toLowerCase();
                if (cat.includes('allopathic') || cat.includes('chemist') || cat.includes('medicine') || cat.includes('pharmacy')) {
                    resolvedImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&fit=crop&q=80';
                } else if (cat.includes('ayurvedic') || cat.includes('herbal') || cat.includes('wellness')) {
                    resolvedImage = 'https://images.unsplash.com/photo-1611070973770-b1a672610041?w=500&fit=crop&q=80';
                } else if (cat.includes('surgical') || cat.includes('equipment') || cat.includes('rehab')) {
                    resolvedImage = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&fit=crop&q=80';
                } else {
                    console.log(`[GoogleImageService] No static fallback matched. Returning empty string for text placeholder fallback.`);
                    resolvedImage = '';
                }
                sourceUsed = 'ultimate-fallback';
            }
        }

        // 4. CACHE RESOLVED IMAGE IN MONGO FOR FUTURE RUNS
        if (resolvedImage) {
            console.log(`[GoogleImageService] Caching resolved image for "${trimmedQuery}" (${sourceUsed}): "${resolvedImage}"`);
            await ProductImageCache.findOneAndUpdate(
                { rawQuery: trimmedQuery },
                {
                    rawQuery: trimmedQuery,
                    imageUrl: resolvedImage,
                    extractedKeywords: keywords,
                    source: sourceUsed
                },
                { upsert: true, new: true }
            );
            return resolvedImage;
        }

        return '';

    } catch (error) {
        console.error('[GoogleImageService] General search pipeline failed:', error.message);
        return '';
    }
};

module.exports = {
    extractProductKeywords,
    searchProductImage
};
