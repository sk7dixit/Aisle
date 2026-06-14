const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const shopType = 'grocery_kirana';
        const total = await MasterCatalogProduct.countDocuments({ shopType });
        console.log(`\n--- Verification Results for shopType: '${shopType}' ---`);
        console.log(`Total Products: ${total}`);

        const categories = await MasterCatalogProduct.distinct('category', { shopType });
        console.log(`Categories found:`, categories);

        for (const cat of categories) {
            const count = await MasterCatalogProduct.countDocuments({ shopType, category: cat });
            console.log(`- ${cat}: ${count} products`);
        }

        // Check fallbacks (imageUrl equals name)
        const fallbackProducts = await MasterCatalogProduct.find({ shopType });
        let fallbackCount = 0;
        let validImageCount = 0;

        for (const p of fallbackProducts) {
            if (p.imageUrl === p.name) {
                fallbackCount++;
            } else {
                validImageCount++;
            }
        }

        console.log(`\nImage Resolutions:`);
        console.log(`- Resolved actual images: ${validImageCount}`);
        console.log(`- Fallbacks to product name: ${fallbackCount}`);

        // Print a few samples
        console.log(`\n--- Samples ---`);
        for (const cat of categories) {
            console.log(`\nCategory: ${cat}`);
            const samples = await MasterCatalogProduct.find({ shopType, category: cat }).limit(3);
            samples.forEach((s, idx) => {
                console.log(`  ${idx + 1}. Name: "${s.name}"`);
                console.log(`     Image: "${s.imageUrl}"`);
                console.log(`     Barcode: "${s.barcode}"`);
                console.log(`     Brand: "${s.brand}"`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
