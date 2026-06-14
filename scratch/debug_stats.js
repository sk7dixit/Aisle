const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../backend/models/User');
const Product = require('../backend/models/Product');
const CATEGORIES = require('../backend/config/categories');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const run = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Counting shops...');
        const shopsCount = await User.countDocuments({ 
            role: 'seller', 
            'shopDetails.shopType': { $nin: ['HOME_BUSINESS', 'SERVICES'] } 
        });
        console.log('Shops count:', shopsCount);

        console.log('Counting creators...');
        const creatorsCount = await User.countDocuments({ 
            role: 'seller', 
            'shopDetails.shopType': 'HOME_BUSINESS' 
        });
        console.log('Creators count:', creatorsCount);

        console.log('Distinct shop types...');
        const activeShopTypes = await User.distinct('shopDetails.shopType', { role: 'seller' });
        console.log('Active shop types:', activeShopTypes);

        const slugToDbSubcat = {
            'general-provision': 'general_provision',
            'fruits-vegetables': 'fruits_vegetables',
            'dairy-ice-cream': 'dairy_bakery',
            'bakery-cake-shop': 'dairy_bakery',
            'sweet-shop': 'sweets_farsan',
            'dry-fruits-spices': 'dry_fruits_spices',
            'wholesale-grain': 'wholesale',
            'organic-gourmet': 'organic',
            'electrical-shop': 'electrical',
            'hardware-sanitary': 'hardware',
            'paints-decor': 'paint',
            'automobile-spares': 'automobile',
            'tools-industrial': 'industrial',
            'mobiles-wearables': 'mobile',
            'computers-gaming': 'computer',
            'tv-appliances': 'consumer_electronics',
            'spares-components': 'repair',
            'school-writing': 'stationery',
            'office-desk': 'office',
            'art-craft': 'art',
            'books-paper': 'books',
            'kitchenware-cookware': 'kitchenware',
            'plastics-cleaning': 'cleaning',
            'beauty-personal': 'other',
            'toys-sports': 'gifts',
            'furnishing-decor': 'furnishing',
            'bags-luggage': 'bags',
            'footwear': 'footwear',
            'clothing-garments': 'clothing',
            'allopathic-chemist': 'allopathic',
            'ayurvedic-herbal': 'ayurvedic',
            'surgical-equipment': 'surgical',
            'homemade-food': 'food',
            'handmade-crafts': 'handicrafts',
            'tuition-coaching': 'other',
            'festival-specific': 'festival',
            'crackers-fireworks': 'crackers',
            'winter-rain-gear': 'weather'
        };

        const categoryIdToShopType = {
            'general-provision': 'GROCERY_KIRANA',
            'fruits-vegetables': 'GROCERY_KIRANA',
            'dairy-ice-cream': 'GROCERY_KIRANA',
            'bakery-cake-shop': 'GROCERY_KIRANA',
            'sweet-shop': 'GROCERY_KIRANA',
            'dry-fruits-spices': 'GROCERY_KIRANA',
            'wholesale-grain': 'GROCERY_KIRANA',
            'organic-gourmet': 'GROCERY_KIRANA',
            'electrical-shop': 'ELECTRICAL_HARDWARE_AUTO',
            'hardware-sanitary': 'ELECTRICAL_HARDWARE_AUTO',
            'paints-decor': 'ELECTRICAL_HARDWARE_AUTO',
            'automobile-spares': 'ELECTRICAL_HARDWARE_AUTO',
            'tools-industrial': 'ELECTRICAL_HARDWARE_AUTO',
            'mobiles-wearables': 'TECH_ACCESSORIES',
            'computers-gaming': 'TECH_ACCESSORIES',
            'tv-appliances': 'TECH_ACCESSORIES',
            'spares-components': 'TECH_ACCESSORIES',
            'school-writing': 'STUDENT_OFFICE',
            'office-desk': 'STUDENT_OFFICE',
            'art-craft': 'STUDENT_OFFICE',
            'books-paper': 'STUDENT_OFFICE',
            'kitchenware-cookware': 'HOME_LIFESTYLE',
            'plastics-cleaning': 'HOME_LIFESTYLE',
            'beauty-personal': 'HOME_LIFESTYLE',
            'toys-sports': 'HOME_LIFESTYLE',
            'furnishing-decor': 'HOME_LIFESTYLE',
            'bags-luggage': 'HOME_LIFESTYLE',
            'footwear': 'HOME_LIFESTYLE',
            'clothing-garments': 'HOME_LIFESTYLE',
            'allopathic-chemist': 'PHARMACY',
            'ayurvedic-herbal': 'PHARMACY',
            'surgical-equipment': 'PHARMACY',
            'homemade-food': 'HOME_BUSINESS',
            'handmade-crafts': 'HOME_BUSINESS',
            'tuition-coaching': 'HOME_BUSINESS',
            'festival-specific': 'SEASONAL_FESTIVE',
            'crackers-fireworks': 'SEASONAL_FESTIVE',
            'winter-rain-gear': 'SEASONAL_FESTIVE'
        };

        console.log('Running category stats loop...');
        for (const cat of CATEGORIES) {
            console.log(`Processing category: ${cat.id}`);
            const dbSubcat = slugToDbSubcat[cat.id] || cat.id;
            const parentShopType = categoryIdToShopType[cat.id];

            console.log(`- Counting stores for ${cat.id}`);
            const storeCount = await User.countDocuments({
                role: 'seller',
                $or: [
                    { 'shopDetails.allowedSubCategories': { $in: [cat.id, dbSubcat] } },
                    { 
                        'shopDetails.shopType': parentShopType, 
                        $or: [
                            { 'shopDetails.allowedSubCategories': { $exists: false } },
                            { 'shopDetails.allowedSubCategories': { $size: 0 } }
                        ]
                    }
                ]
            });
            console.log(`  Store count: ${storeCount}`);

            console.log(`- Counting products for ${cat.id}`);
            const productCount = await Product.countDocuments({
                categorySlug: cat.id,
                isAvailable: { $ne: false },
                isDraft: { $ne: true },
                adminStatus: 'Active'
            });
            console.log(`  Product count: ${productCount}`);
        }

        console.log('Finished successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
