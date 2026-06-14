const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../models/User');

async function run() {
    try {
        mongoose.set('autoIndex', false);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB:", mongoose.connection.name);
        
        const targetEmail = 'seller@aisle.com';
        const targetUser = await User.findOne({ email: targetEmail });
        if (targetUser) {
            targetUser.failedAttempts = 0;
            targetUser.lockUntil = null;
            targetUser.accountStatus = 'active';
            await targetUser.save();
            console.log(`SUCCESS: Unlocked account for ${targetEmail}`);
        } else {
            console.log(`Target email ${targetEmail} not found!`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
run();
