const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../backend/models/User');
const Product = require('../backend/models/Product');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const run = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const t0 = Date.now();
        
        // Execute only 2 parallel queries: one User find and one Product aggregate
        const [sellers, productCounts] = await Promise.all([
            User.find({ role: 'seller' })
                .select('shopDetails.shopType shopDetails.allowedSubCategories')
                .lean(),
            Product.aggregate([
                {
                    $match: {
                        isAvailable: { $ne: false },
                        isDraft: { $ne: true },
                        adminStatus: 'Active'
                    }
                },
                {
                    $group: {
                        _id: "$categorySlug",
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Compute counts in memory
        let shopsCount = 0;
        let creatorsCount = 0;
        const activeShopTypesSet = new Set();

        sellers.forEach(seller => {
            const shopType = seller.shopDetails?.shopType;
            if (shopType) {
                activeShopTypesSet.add(shopType);
                if (shopType === 'HOME_BUSINESS') {
                    creatorsCount++;
                } else if (shopType !== 'SERVICES') {
                    shopsCount++;
                }
            }
        });

        const categoriesCount = activeShopTypesSet.size;

        const totalTime = Date.now() - t0;
        console.log(`Super optimized parallel execution time: ${totalTime}ms`);
        console.log(`Shops: ${shopsCount}, Creators: ${creatorsCount}, ShopTypes: ${categoriesCount}, Sellers: ${sellers.length}, Products: ${productCounts.length}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
