const mongoose = require('mongoose');
const User = require('./backend/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const seller = await User.findOne({ "shopDetails.shopName": /Dixit Mart/i });

        if (seller) {
            console.log(`Shop: ${seller.shopDetails.shopName}`);
            console.log(`City: ${seller.shopDetails.city}`);
            console.log(`Area: ${seller.shopDetails.area}`);
            console.log(`Address: ${seller.shopDetails.address}`);
            console.log(`Coordinates:`, seller.shopDetails.shopLocation?.coordinates);
            console.log(`Is Active: ${seller.shopDetails.isActive}`); // Check if active
        } else {
            console.log("Dixit Mart not found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
