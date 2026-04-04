/**
 * Quick Fix: Update specific user's shop type
 * This will update the user with email shashwatdixit33@gmail.com
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const updateSpecificUser = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'shashwatdixit33@gmail.com';

        console.log(`\n🔍 Finding user: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log(`\n📊 Current shop type: "${user.shopDetails?.shopType}"`);

        // Update to ELECTRICAL_HARDWARE_AUTO
        user.shopDetails.shopType = 'ELECTRICAL_HARDWARE_AUTO';
        await user.save();

        console.log(`✅ Updated shop type to: "ELECTRICAL_HARDWARE_AUTO"`);
        console.log('\n✅ Update complete. Please refresh your browser.');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
};

updateSpecificUser();
