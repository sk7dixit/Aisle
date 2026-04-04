/**
 * Verify user's current shop type in database
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const verifyUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email: 'shashwatdixit33@gmail.com' });

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('\n📊 User Details:');
        console.log('   Email:', user.email);
        console.log('   Shop Name:', user.shopDetails?.shopName);
        console.log('   Shop Type:', user.shopDetails?.shopType);
        console.log('   Role:', user.role);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verifyUser();
