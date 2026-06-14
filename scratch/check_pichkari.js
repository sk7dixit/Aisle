const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');

async function run() {
    try {
        await connectDB();
        const products = await MasterCatalogProduct.find({
            shopType: 'seasonal_festive',
            name: { $regex: /Pichkari|Gulal/i }
        });
        
        console.log(`Found ${products.length} Pichkari/Gulal products:`);
        products.forEach(p => {
            console.log(`- Name: "${p.name}" | Image: "${p.imageUrl}"`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
