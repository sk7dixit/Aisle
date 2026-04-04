
const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const checkSellers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const sellers = await User.find({ role: 'seller' });
        console.log(`Found ${sellers.length} sellers.`);

        sellers.forEach(s => {
            console.log(`- Name: ${s.name}, Email: ${s.email}, Status: ${s.verificationStatus}, Shop: ${s.shopDetails?.shopName}`);
        });

        // Also check if any users have shopDetails but are not sellers (edge case)
        const weirdUsers = await User.find({ role: { $ne: 'seller' }, 'shopDetails.shopName': { $exists: true, $ne: null } });
        if (weirdUsers.length > 0) {
            console.log('\nWARNING: Users with shopDetails but NOT role=seller:');
            weirdUsers.forEach(s => {
                console.log(`- Name: ${s.name}, Role: ${s.role}, Shop: ${s.shopDetails?.shopName}`);
            });
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkSellers();
