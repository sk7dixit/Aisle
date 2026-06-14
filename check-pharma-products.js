const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

const Product = require('./backend/models/Product');

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const prods = await Product.find({ shopType: 'PHARMACY' }).limit(5);
        console.log(`Total Pharmacy products: ${await Product.countDocuments({ shopType: 'PHARMACY' })}`);
        prods.forEach(p => {
            console.log(`Product: ID=${p._id}, Name="${p.name}", CategorySlug="${p.categorySlug}", isAvailable=${p.isAvailable}, seller=${p.seller}, shop=${p.shop}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
