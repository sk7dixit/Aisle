const mongoose = require('mongoose');
const User = require('../backend/models/User');
const { deriveShopStatus } = require('../backend/utils/shopStatusUtils');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const sellers = await User.find({ role: 'seller' });
        console.log(`Found ${sellers.length} sellers:`);
        
        sellers.forEach((s, i) => {
            const sd = s.shopDetails || {};
            console.log(`\n--- Seller ${i+1}: ${sd.shopName || 'No Name'} ---`);
            console.log(`ID: ${s._id}`);
            console.log(`Email: ${s.email}`);
            console.log(`Verification Status: ${s.verificationStatus}`);
            console.log(`Account Status: ${s.accountStatus}`);
            console.log(`Derived Status: ${deriveShopStatus(sd)}`);
            console.log(`Coordinates:`, sd.shopLocation?.coordinates);
            console.log(`Photos:`, sd.photos);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
