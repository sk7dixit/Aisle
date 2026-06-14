const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');

async function run() {
    try {
        await connectDB();
        const products = await MasterCatalogProduct.find({ shopType: 'seasonal_festive' });
        console.log(`Total Seasonal & Festive Products: ${products.length}`);
        
        const unsplashProds = products.filter(p => p.imageUrl && p.imageUrl.includes('unsplash.com'));
        console.log(`Products with Unsplash Images: ${unsplashProds.length}`);
        unsplashProds.forEach(p => {
            console.log(`- Name: "${p.name}", Category: "${p.category}", ImageUrl: ${p.imageUrl}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
