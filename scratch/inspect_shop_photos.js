const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../backend/models/User');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const sellers = await User.find({ role: 'seller' }).lean();
        
        console.log(`Found ${sellers.length} sellers:`);
        for (const s of sellers) {
            console.log(`\nSeller: ${s.shopDetails?.shopName} (ID: ${s._id})`);
            console.log(`- shopType: ${s.shopDetails?.shopType}`);
            console.log(`- photos:`, s.shopDetails?.photos);
            console.log(`- visualAssets:`, s.shopDetails?.visualAssets);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
