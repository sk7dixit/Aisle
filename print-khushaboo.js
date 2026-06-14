const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

const User = require('./backend/models/User');

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const user = await User.findOne({ role: 'seller', 'shopDetails.shopType': 'PHARMACY' });
        console.log("KHUSHABOO SHOP DETAILS:", JSON.stringify(user.shopDetails, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
