const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const MasterCatalogProduct = require('./models/MasterCatalogProduct');
const { searchProductImage } = require('./services/googleImageService');

dotenv.config();

// EAN-13 check digit calculator
const generateBarcode = (baseNum) => {
    const str = baseNum.toString();
    let sumEven = 0;
    let sumOdd = 0;
    
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(str[i]);
        if (i % 2 === 1) {
            sumEven += digit;
        } else {
            sumOdd += digit;
        }
    }
    
    const total = sumOdd + (sumEven * 3);
    const remainder = total % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    
    return str + checkDigit.toString();
};

// Normalize names for indexing
const normalizeName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, ' ');
};

// Realistic brand-product validator to keep the catalog premium and protect API limits
const isRealisticPair = (brand, productName) => {
    const b = brand.toLowerCase();
    const p = productName.toLowerCase();
    
    if (b === 'tata') {
        return p.includes('salt') || p.includes('tea') || p.includes('coffee') || p.includes('ghee') || p.includes('rice');
    }
    if (b === 'aashirvaad') {
        return p.includes('atta') || p.includes('rice') || p.includes('ghee') || p.includes('spices') || p.includes('masala');
    }
    if (b === 'colgate' || b === 'pepsodent') {
        return p.includes('toothpaste');
    }
    if (b === 'dettol') {
        return p.includes('handwash') || p.includes('soap');
    }
    if (b === 'surf excel' || b === 'ariel') {
        return p.includes('detergent') || p.includes('fabric conditioner') || p.includes('active white');
    }
    if (b === 'vim') {
        return p.includes('dishwash');
    }
    if (b === 'harpic') {
        return p.includes('toilet cleaner');
    }
    if (b === 'lizol') {
        return p.includes('floor cleaner');
    }
    if (b === 'fortune') {
        return p.includes('oil') || p.includes('rice') || p.includes('ghee');
    }
    if (b === 'everest' || b === 'mdh') {
        return p.includes('spices') || p.includes('masala') || p.includes('garam');
    }
    if (b === 'nestle') {
        return p.includes('noodles') || p.includes('coffee') || p.includes('chocolate');
    }
    if (b === 'cadbury') {
        return p.includes('chocolate');
    }
    if (b === 'clinic plus') {
        return p.includes('shampoo');
    }
    if (b === 'dove') {
        return p.includes('shampoo') || p.includes('soap');
    }
    if (b === 'lifebuoy' || b === 'lux' || b === 'pears') {
        return p.includes('soap') || p.includes('handwash');
    }
    if (b === 'comfort') {
        return p.includes('fabric conditioner');
    }
    if (b === 'chings') {
        return p.includes('noodles') || p.includes('ketchup') || p.includes('sauce');
    }
    if (b === 'kissan') {
        return p.includes('jam') || p.includes('ketchup') || p.includes('sauce');
    }
    if (b === 'gillette') {
        return p.includes('shaving') || p.includes('foam');
    }
    
    return false;
};

const GroceryBrands = ['Tata', 'Aashirvaad', 'Colgate', 'Dettol', 'Surf Excel', 'Vim', 'Harpic', 'Lizol', 'Fortune', 'Everest', 'MDH', 'Nestle', 'Cadbury', 'Pepsodent', 'Clinic Plus', 'Dove', 'Lifebuoy', 'Lux', 'Pears', 'Comfort', 'Ariel', 'Chings', 'Kissan', 'Gillette'];
const GroceryProducts = [
    { name: 'Iodized Table Salt', subcat: 'Salt & Sugar', baseMrp: 28 },
    { name: 'Strong Teeth Toothpaste Pack', subcat: 'Oral Care', baseMrp: 95 },
    { name: 'Liquid Handwash Refill Pouch', subcat: 'Personal Care', baseMrp: 99 },
    { name: 'Easy Wash Detergent Powder', subcat: 'Detergents', baseMrp: 140 },
    { name: 'Liquid Dishwash Vim Lemon', subcat: 'Home Cleaning', baseMrp: 55 },
    { name: 'Disinfectant Floor Cleaner Liquid', subcat: 'Home Cleaning', baseMrp: 120 },
    { name: 'Blue Toilet Cleaner Power Plus', subcat: 'Home Cleaning', baseMrp: 90 },
    { name: 'Kachi Ghani Pure Mustard Oil', subcat: 'Edible Oils', baseMrp: 175 },
    { name: 'Refined Soyabean Oil Pack', subcat: 'Edible Oils', baseMrp: 145 },
    { name: 'Garam Masala Authentic Blend', subcat: 'Spices', baseMrp: 45 },
    { name: '2-Minute Masala Noodles Pack', subcat: 'Noodles & Pasta', baseMrp: 14 },
    { name: 'Mixed Fruit Jam Classic', subcat: 'Spreads & Jams', baseMrp: 85 },
    { name: 'Premium Green Tea Bags Box', subcat: 'Beverages', baseMrp: 150 },
    { name: 'Instant Coffee Powder Jar', subcat: 'Beverages', baseMrp: 190 },
    { name: 'Strong CTC Assam Tea Powder', subcat: 'Beverages', baseMrp: 130 },
    { name: 'Anti Dandruff Daily Shampoo', subcat: 'Personal Care', baseMrp: 180 },
    { name: 'Beauty Cream Moisturizing Soap', subcat: 'Personal Care', baseMrp: 45 },
    { name: 'Tomato Ketchup Squeeze Bottle', subcat: 'Sauces & Dressing', baseMrp: 120 },
    { name: 'Premium Milk Chocolate Bar', subcat: 'Sweets & Chocolates', baseMrp: 40 },
    { name: 'Liquid Fabric Conditioner After Wash', subcat: 'Detergents', baseMrp: 60 },
    { name: 'Active White Detergent Powder', subcat: 'Detergents', baseMrp: 70 },
    { name: 'Shaving Foam Classic Sensitive', subcat: 'Personal Care', baseMrp: 135 },
    { name: 'Desi Cow Ghee Pure Tin', subcat: 'Ghee & Butter', baseMrp: 350 },
    { name: 'Basmati Rice Premium Dubar', subcat: 'Rice & Atta', baseMrp: 110 }
];

const Sizes = ['50g', '100g', '200g', '500g', '1kg', '2kg', '5kg', '100ml', '200ml', '500ml', '1L', '2L', '5L', 'Pack of 1', 'Pack of 4', 'Pack of 12'];

// In-memory runtime cache to collapse identical brand+product templates and prevent duplicate API hits!
const runCache = {};

const resolveProductImage = async (brand, baseName, category) => {
    // Generate a cache key based on the brand + baseName (ignores sizes for identical product variants!)
    const cleanBaseName = baseName.replace(/\(\d+(\.\d+)?\s*(g|kg|ml|l|ltr|oz|kgm|gm|tablet|cap|pcs|piece|packet|pack|sachets|serving)s?\)/gi, '').trim();
    const cacheKey = `${brand} ${cleanBaseName}`.toLowerCase().trim();

    if (runCache[cacheKey]) {
        return runCache[cacheKey];
    }

    try {
        console.log(`[DynamicSeeder] Fetching dynamic search image for: "${brand} ${cleanBaseName}" (${category})...`);
        // Call the intelligent searchProductImage service!
        // This will check MongoDB cache -> Unsplash Search -> Google Custom Search.
        const imageUrl = await searchProductImage(`${brand} ${cleanBaseName}`, { brand, category });
        
        if (imageUrl) {
            runCache[cacheKey] = imageUrl;
            return imageUrl;
        }
    } catch (err) {
        console.warn(`[DynamicSeeder] Image resolution failed for "${brand} ${cleanBaseName}":`, err.message);
    }

    // Default ultimate fallback
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500';
};

const seed = async () => {
    // Define helper fallback URLs for catalog bases compilation
    const imgSpices = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400';
    const imgRice = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400';
    const imgTea = 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400';

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aisle');
        console.log('Connected to Database successfully!');

        console.log('Removing old MasterCatalogProduct entries for grocery_kirana...');
        const deleteCount = await MasterCatalogProduct.deleteMany({ shopType: 'grocery_kirana' });
        console.log(`Deleted ${deleteCount.deletedCount} old catalog products.`);

        const productsToSeed = [];
        let barcodeCounter = 890100010000; 
        let gpCount = 0;
        
        console.log('Generating General Provision / Kirana products with DYNAMIC images...');
        
        outerLoop:
        for (let bIndex = 0; bIndex < GroceryBrands.length; bIndex++) {
            const brand = GroceryBrands[bIndex];
            
            for (let pIndex = 0; pIndex < GroceryProducts.length; pIndex++) {
                const p = GroceryProducts[pIndex];
                
                // Skip unrealistic brand-product combinations!
                if (!isRealisticPair(brand, p.name)) {
                    continue;
                }

                // Resolve dynamic product image once per template, avoiding duplicate API calls!
                const imageUrl = await resolveProductImage(brand, p.name, 'General Provision / Kirana');
                
                for (let sIndex = 0; sIndex < Sizes.length; sIndex++) {
                    const size = Sizes[sIndex];
                    
                    const isLiquid = p.name.toLowerCase().includes('liquid') || p.name.toLowerCase().includes('oil') || p.name.toLowerCase().includes('cleaner') || p.name.toLowerCase().includes('shampoo') || p.name.toLowerCase().includes('drink') || p.name.toLowerCase().includes('water');
                    const sizeIsLiquid = size.endsWith('ml') || size.endsWith('L');
                    
                    if (isLiquid && !sizeIsLiquid) continue;
                    if (!isLiquid && sizeIsLiquid) continue;
                    
                    const productName = `${brand} ${p.name} (${size})`;
                    const barcode = generateBarcode(barcodeCounter++);
                    
                    productsToSeed.push({
                        name: productName,
                        normalizedName: normalizeName(productName),
                        brand: brand,
                        category: 'General Provision / Kirana',
                        shopType: 'grocery_kirana',
                        imageUrl: imageUrl,
                        barcode: barcode,
                        source: 'bulk',
                        externalId: `gen_prov_${gpCount}`
                    });
                    
                    gpCount++;
                }
            }
        }
        
        console.log(`Generated ${gpCount} General Provision / Kirana products.`);

        // Other Specialized Categories with dynamic & verified Unsplash images
        console.log('Generating 700 other specialized grocery items...');
        let otherCount = 0;

        // 1. Fruits & Vegetables (Target: 100 products)
        const fvItems = [
            { name: 'Fresh Potato (Aloo)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400' },
            { name: 'Red Onion (Kanda)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1618519764620-7403abdbfee9?w=400' },
            { name: 'Desi Tomato (Tamatar)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400' },
            { name: 'Gala Red Apples', brand: 'Premium Fruit', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400' },
            { name: 'Robusta Banana (Kela)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
            { name: 'Alphonso Mango (Hapus)', brand: 'Ratnagiri', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400' },
            { name: 'Fresh Ginger (Adrak)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400' },
            { name: 'Fresh Garlic (Lahsun)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?w=400' },
            { name: 'Green Coriander (Kothmir)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1588879460618-924f5a60dd56?w=400' },
            { name: 'Fresh Lemon (Nimboo)', brand: 'Fresh Farms', category: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400' }
        ];

        for (let i = 0; i < 10; i++) {
            for (const item of fvItems) {
                const suffix = i === 0 ? '' : ` Grade ${String.fromCharCode(65 + i)}`;
                const name = `${item.name}${suffix}`;
                // Resolve dynamic Unsplash image for fresh fruit/vegetable items
                const imageUrl = await resolveProductImage(item.brand, item.name, 'Fruits & Vegetables');
                
                productsToSeed.push({
                    name: name,
                    normalizedName: normalizeName(name),
                    brand: item.brand,
                    category: 'Fruits & Vegetables',
                    shopType: 'grocery_kirana',
                    imageUrl: imageUrl,
                    barcode: generateBarcode(barcodeCounter++),
                    source: 'bulk',
                    externalId: `other_fv_${otherCount++}`
                });
            }
        }

        // 2. Dairy & Ice Cream (Target: 100 products)
        const imgDairyMilk = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400';
        const imgDairyCheese = 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=400';
        const imgDairyIceCream = 'https://images.unsplash.com/photo-1501443762811-7f16854497c8?w=400';
        const dairyBrands = ['Amul', 'Mother Dairy', 'Nandini', 'Govardhan', 'Gopal', 'Baskin Robbins', 'Kwality Walls', 'Vadilal'];
        const dairyBases = [
            { name: 'Gold Full Cream Milk', img: imgDairyMilk, size: '500ml' },
            { name: 'Taaza Fresh Toned Milk', img: imgDairyMilk, size: '500ml' },
            { name: 'Masti Dahi Cup', img: imgDairyMilk, size: '200g' },
            { name: 'Fresh Paneer Block', img: imgDairyCheese, size: '200g' },
            { name: 'Salted Pasteurised Butter', img: imgDairyCheese, size: '100g' },
            { name: 'Cheese Slices Pack of 10', img: imgDairyCheese, size: '200g' },
            { name: 'Vanilla Ice Cream Tub', img: imgDairyIceCream, size: '700ml' },
            { name: 'Chocolate Feast Ice Cream Cone', img: imgDairyIceCream, size: '120ml' },
            { name: 'Buttermilk Pouch', img: imgDairyMilk, size: '500ml' },
            { name: 'Sweet Lassi Bottle', img: imgDairyMilk, size: '200ml' }
        ];

        for (let i = 0; i < 10; i++) {
            const brand = dairyBrands[i % dairyBrands.length];
            for (const base of dairyBases) {
                const sizeSuffix = i % 2 === 0 ? '' : ' Large';
                const name = `${brand} ${base.name}${sizeSuffix} (${base.size})`;
                const imageUrl = await resolveProductImage(brand, base.name, 'Dairy & Ice Cream');
                
                productsToSeed.push({
                    name: name,
                    normalizedName: normalizeName(name),
                    brand: brand,
                    category: 'Dairy & Ice Cream',
                    shopType: 'grocery_kirana',
                    imageUrl: imageUrl,
                    barcode: generateBarcode(barcodeCounter++),
                    source: 'bulk',
                    externalId: `other_dairy_${otherCount++}`
                });
            }
        }

        // 3. Bakery & Cake Shop (Target: 100 products)
        const imgBread = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400';
        const imgCake = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400';
        const bakeryBrands = ['Britannia', 'Wibs', 'English Oven', 'Modern', 'Harvest Gold', 'Elite'];
        const bakeryBases = [
            { name: 'Soft White Bread Pouch', img: imgBread, size: '400g' },
            { name: 'Whole Wheat Atta Bread', img: imgBread, size: '400g' },
            { name: 'Healthy Brown Bread', img: imgBread, size: '400g' },
            { name: 'Toasty Milk Rusk Pack', img: imgBread, size: '200g' },
            { name: 'Ladi Pav Pack of 6', img: imgBread, size: '200g' },
            { name: 'Burger Buns Pack of 2', img: imgBread, size: '150g' },
            { name: 'Sweet Tutti Frutti Bread', img: imgBread, size: '300g' },
            { name: 'Chocolate Lava Cake', img: imgCake, size: '80g' },
            { name: 'Eggless Fruit Cake Slice', img: imgCake, size: '150g' },
            { name: 'Vanilla Cream Roll Pack', img: imgCake, size: '60g' }
        ];

        for (let i = 0; i < 10; i++) {
            const brand = bakeryBrands[i % bakeryBrands.length];
            for (const base of bakeryBases) {
                const name = `${brand} ${base.name} Premium (${base.size})`;
                const imageUrl = await resolveProductImage(brand, base.name, 'Bakery & Cake Shop');
                
                productsToSeed.push({
                    name: name,
                    normalizedName: normalizeName(name),
                    brand: brand,
                    category: 'Bakery & Cake Shop',
                    shopType: 'grocery_kirana',
                    imageUrl: imageUrl,
                    barcode: generateBarcode(barcodeCounter++),
                    source: 'bulk',
                    externalId: `other_bakery_${otherCount++}`
                });
            }
        }

        // 4. Sweet Shop (Mithai & Farsan) (Target: 100 products)
        const imgMithai = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400';
        const sweetBrands = ['Haldirams', 'Bikano', 'Ghasitaram', 'K C Das', 'Bikanervala', 'Lalji Mithai'];
        const sweetBases = [
            { name: 'Kaju Katli Diamond Cuts Box', img: imgMithai, size: '250g' },
            { name: 'Desi Ghee Motichoor Ladoo Box', img: imgMithai, size: '500g' },
            { name: 'Sponge Rasgulla Tin', img: imgMithai, size: '1kg' },
            { name: 'Gulab Jamun Sweet Tin', img: imgMithai, size: '1kg' },
            { name: 'Soan Papdi Premium Box', img: imgMithai, size: '250g' },
            { name: 'Desi Ghee Besan Ladoo Box', img: imgMithai, size: '400g' },
            { name: 'Moong Dal Halwa Instant Mix', img: imgMithai, size: '200g' },
            { name: 'Methi Mathri Namkeen Farsan', img: imgMithai, size: '400g' },
            { name: 'Dry Fruit Petha Sweet Box', img: imgMithai, size: '500g' },
            { name: 'Bombay Ice Halwa Slices', img: imgMithai, size: '250g' }
        ];

        for (let i = 0; i < 10; i++) {
            const brand = sweetBrands[i % sweetBrands.length];
            for (const base of sweetBases) {
                const name = `${brand} ${base.name} Traditional (${base.size})`;
                const imageUrl = await resolveProductImage(brand, base.name, 'Sweet Shop');
                
                productsToSeed.push({
                    name: name,
                    normalizedName: normalizeName(name),
                    brand: brand,
                    category: 'Sweet Shop (Mithai & Farsan)',
                    shopType: 'grocery_kirana',
                    imageUrl: imageUrl,
                    barcode: generateBarcode(barcodeCounter++),
                    source: 'bulk',
                    externalId: `other_sweet_${otherCount++}`
                });
            }
        }

        // 5. Dry Fruits & Spices (Target: 100 products)
        const imgDryFruits = 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400';
        const spiceBrands = ['Everest', 'MDH', 'Catch', 'Tata Sampann', 'Goldiee', 'Ramdev', 'DryFruit Premium'];
        const spiceBases = [
            { name: 'California Almonds Whole (Badam)', img: imgDryFruits, size: '250g' },
            { name: 'Jumbo W320 Cashew Nuts (Kaju)', img: imgDryFruits, size: '250g' },
            { name: 'Salted Roasted Pistachios (Pista)', img: imgDryFruits, size: '200g' },
            { name: 'Garam Masala Powder Kitchen King', img: imgSpices, size: '100g' },
            { name: 'Turmeric Powder (Haldi Powder)', img: imgSpices, size: '200g' },
            { name: 'Tikhalal Red Chilli Powder', img: imgSpices, size: '200g' },
            { name: 'Coriander Powder (Dhania Powder)', img: imgSpices, size: '200g' },
            { name: 'Kashmiri Lal Chilli Powder Special', img: imgSpices, size: '100g' },
            { name: 'Chat Masala Sprinkler Bottle', img: imgSpices, size: '50g' },
            { name: 'Sabji Masala Powder Blend', img: imgSpices, size: '100g' }
        ];

        for (let i = 0; i < 10; i++) {
            const brand = spiceBrands[i % spiceBrands.length];
            for (const base of spiceBases) {
                const name = `${brand} ${base.name} (${base.size})`;
                const imageUrl = await resolveProductImage(brand, base.name, 'Dry Fruits & Spices');
                
                productsToSeed.push({
                    name: name,
                    normalizedName: normalizeName(name),
                    brand: brand,
                    category: 'Dry Fruits & Spices',
                    shopType: 'grocery_kirana',
                    imageUrl: imageUrl,
                    barcode: generateBarcode(barcodeCounter++),
                    source: 'bulk',
                    externalId: `other_spice_${otherCount++}`
                });
            }
        }

        // 6. Wholesale / Grain Mart (Target: 100 products)
        const imgGrains = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400';
        const grainBrands = ['Aashirvaad', 'India Gate', 'Fortune', 'Lal Qilla', 'Daawat', 'Loose wholesale'];
        const grainBases = [
            { name: 'Shudh Chakki Atta Bag', img: imgGrains, size: '10kg' },
            { name: 'Basmati Rice Dubar Grain Bag', img: imgRice, size: '25kg' },
            { name: 'Basmati Rice Tibar Long Grain', img: imgRice, size: '5kg' },
            { name: 'Unpolished Toor Dal Split', img: imgGrains, size: '2kg' },
            { name: 'Premium Chana Dal Split Gram', img: imgGrains, size: '2kg' },
            { name: 'Yellow Split Moong Dal Clean', img: imgGrains, size: '1kg' },
            { name: 'Whole Kabuli Chana Large', img: imgGrains, size: '1kg' },
            { name: 'Cleaned Brown Horse Gram (Kulthi)', img: imgGrains, size: '1kg' },
            { name: 'Premium White Urad Dal Wash', img: imgGrains, size: '2kg' },
            { name: 'Basmati Rice Rozana Standard Bag', img: imgRice, size: '10kg' }
        ];

        for (let i = 0; i < 10; i++) {
            const brand = grainBrands[i % grainBrands.length];
            for (const base of grainBases) {
                const name = `${brand} ${base.name} (${base.size})`;
                const imageUrl = await resolveProductImage(brand, base.name, 'Wholesale / Grain Mart');
                
                productsToSeed.push({
                    name: name,
                    normalizedName: normalizeName(name),
                    brand: brand,
                    category: 'Wholesale / Grain Mart',
                    shopType: 'grocery_kirana',
                    imageUrl: imageUrl,
                    barcode: generateBarcode(barcodeCounter++),
                    source: 'bulk',
                    externalId: `other_grain_${otherCount++}`
                });
            }
        }

        // 7. Organic / Gourmet (Target: 100 products)
        const imgOrganic = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
        const imgHoney = 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400';
        const organicBrands = ['24 Mantra Organic', 'Organic Tattva', 'Pro Nature', 'Organic India', 'Borges', 'Del Monte'];
        const organicBases = [
            { name: 'Pure Wild Honey Bottle', img: imgHoney, size: '500g' },
            { name: 'Organic Cold Pressed Mustard Oil', img: imgOrganic, size: '1L' },
            { name: 'Organic Brown Basmati Rice', img: imgRice, size: '1kg' },
            { name: 'Organic Shudh Chakki Atta Bag', img: imgOrganic, size: '5kg' },
            { name: 'Organic Tulsi Ginger Green Tea', img: imgTea, size: '25 Bags' },
            { name: 'Extra Virgin Pure Olive Oil Bottle', img: imgOrganic, size: '1L' },
            { name: 'Organic Brown Demerara Sugar', img: imgOrganic, size: '500g' },
            { name: 'Organic Premium Rolled Oats Jar', img: imgOrganic, size: '500g' },
            { name: 'Gluten Free Multi Grain Muesli', img: imgOrganic, size: '400g' },
            { name: 'Pure Organic Apple Cider Vinegar', img: imgOrganic, size: '500ml' }
        ];

        for (let i = 0; i < 10; i++) {
            const brand = organicBrands[i % organicBrands.length];
            for (const base of organicBases) {
                const name = `${brand} ${base.name} (${base.size})`;
                const imageUrl = await resolveProductImage(brand, base.name, 'Organic / Gourmet');
                
                productsToSeed.push({
                    name: name,
                    normalizedName: normalizeName(name),
                    brand: brand,
                    category: 'Organic / Gourmet',
                    shopType: 'grocery_kirana',
                    imageUrl: imageUrl,
                    barcode: generateBarcode(barcodeCounter++),
                    source: 'bulk',
                    externalId: `other_organic_${otherCount++}`
                });
            }
        }

        console.log(`Generated ${otherCount} other specialized grocery items.`);
        console.log(`Total generated products list length: ${productsToSeed.length}`);

        console.log('Writing records to MongoDB in chunks...');
        const chunkSize = 500;
        for (let i = 0; i < productsToSeed.length; i += chunkSize) {
            const chunk = productsToSeed.slice(i, i + chunkSize);
            await MasterCatalogProduct.insertMany(chunk);
            console.log(`Successfully seeded chunk ${i / chunkSize + 1} (${chunk.length} products).`);
        }

        console.log('--- SEEDING SUCCESSFULLY COMPLETE! ---');
        console.log(`Saturated DB with ${productsToSeed.length} total Master Catalog items!`);
        process.exit(0);

    } catch (error) {
        console.error('CRITICAL SEEDING FAILURE:', error);
        process.exit(1);
    }
};

seed();
