const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Product = require('../models/Product');
const User = require('../models/User');
const Shop = require('../models/Shop');

async function run() {
    try {
        mongoose.set('autoIndex', false);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB:", mongoose.connection.name);
        
        const sellers = await User.find({ role: 'seller' });
        console.log(`Found ${sellers.length} sellers in User collection.`);
        
        for (const s of sellers) {
            const prodCount = await Product.countDocuments({ seller: s._id });
            const shopCount = await Shop.countDocuments({ owner: s._id });
            console.log(`Seller: ${s.email} (ID: ${s._id}) | Products: ${prodCount} | Shops: ${shopCount}`);
        }
        
        // Reset password for seller@aisle.com
        const targetEmail = 'seller@aisle.com';
        const targetUser = await User.findOne({ email: targetEmail });
        if (targetUser) {
            const salt = await bcrypt.genSalt(10);
            targetUser.password = await bcrypt.hash('password123', salt);
            await targetUser.save();
            console.log(`SUCCESS: Reset password for ${targetEmail} to 'password123'`);
            
            // Trigger revenue intelligence pipeline for this seller
            const { runRevenuePipelineForSeller } = require('../services/revenueIntelligenceService');
            console.log("Triggering runRevenuePipelineForSeller...");
            await runRevenuePipelineForSeller(targetUser._id);
            console.log("Pipeline run complete.");
        } else {
            console.log(`Target email ${targetEmail} not found!`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
run();
