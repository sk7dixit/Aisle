const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const Product = require('../backend/models/Product');
const { decrypt } = require('../backend/utils/encryption');

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        const targetNames = ['Soniya Saini', 'Shashwat Dixit ', 'Grocerry retails '];
        const users = await User.find({ name: { $in: targetNames } }).lean();
        console.log(`Matching users found: ${users.length}`);
        
        for (let user of users) {
            const emailDec = decrypt(user.email);
            const mobileDec = decrypt(user.mobile || user.phone);
            const productCount = await Product.countDocuments({ seller: user._id });
            console.log(`Name: ${user.name}`);
            console.log(`ID: ${user._id}`);
            console.log(`Role: ${user.role}`);
            console.log(`Email: ${emailDec}`);
            console.log(`Mobile: ${mobileDec}`);
            console.log(`Created At: ${user.createdAt}`);
            console.log(`Verification Status: ${user.verificationStatus}`);
            console.log(`Products Count: ${productCount}`);
            console.log(`Shop Details:`, JSON.stringify(user.shopDetails, null, 2));
            console.log('----------------------------------------------------');
        }

    } catch (err) {
        console.error('Error in script:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

run();
