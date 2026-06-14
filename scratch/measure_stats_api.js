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
        const connStart = Date.now();
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected in ${Date.now() - connStart}ms`);

        const t0 = Date.now();
        // 1. Total shops
        const shopsCount = await User.countDocuments({ 
            role: 'seller', 
            'shopDetails.shopType': { $nin: ['HOME_BUSINESS', 'SERVICES'] } 
        });
        const t1 = Date.now();
        console.log(`ShopsCount query: ${t1 - t0}ms (Count: ${shopsCount})`);

        // 2. Total creators
        const creatorsCount = await User.countDocuments({ 
            role: 'seller', 
            'shopDetails.shopType': 'HOME_BUSINESS' 
        });
        const t2 = Date.now();
        console.log(`CreatorsCount query: ${t2 - t1}ms (Count: ${creatorsCount})`);

        // 3. Active shop types
        const activeShopTypes = await User.distinct('shopDetails.shopType', { role: 'seller' });
        const t3 = Date.now();
        console.log(`ActiveShopTypes distinct query: ${t3 - t2}ms (Length: ${activeShopTypes.length})`);

        // 4. Sellers query
        const sellers = await User.find({ role: 'seller' }).lean();
        const t4 = Date.now();
        console.log(`Sellers query: ${t4 - t3}ms (Count: ${sellers.length})`);

        // 5. Product counts aggregation
        const productCounts = await Product.aggregate([
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
        ]);
        const t5 = Date.now();
        console.log(`ProductCounts aggregation query: ${t5 - t4}ms (Groups: ${productCounts.length})`);
        
        console.log(`Total query execution time: ${t5 - t0}ms`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
