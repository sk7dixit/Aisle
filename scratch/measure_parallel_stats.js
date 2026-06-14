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
        
        // Execute all queries in parallel and project only the required fields
        const [shopsCount, creatorsCount, activeShopTypes, sellers, productCounts] = await Promise.all([
            User.countDocuments({ 
                role: 'seller', 
                'shopDetails.shopType': { $nin: ['HOME_BUSINESS', 'SERVICES'] } 
            }),
            User.countDocuments({ 
                role: 'seller', 
                'shopDetails.shopType': 'HOME_BUSINESS' 
            }),
            User.distinct('shopDetails.shopType', { role: 'seller' }),
            User.find({ role: 'seller' }).select('shopDetails role').lean(),
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

        const totalTime = Date.now() - t0;
        console.log(`Parallel execution time: ${totalTime}ms`);
        console.log(`Shops: ${shopsCount}, Creators: ${creatorsCount}, ShopTypes: ${activeShopTypes.length}, Sellers: ${sellers.length}, Products: ${productCounts.length}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
