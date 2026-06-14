const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');

async function verify() {
    try {
        await connectDB();
        
        const count = await MasterCatalogProduct.countDocuments({ shopType: 'seasonal_festive' });
        console.log(`Total Seasonal & Festive Master Catalog Products: ${count}`);
        
        const categories = await MasterCatalogProduct.aggregate([
            { $match: { shopType: 'seasonal_festive' } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        console.log("Category Distribution:");
        categories.forEach(cat => {
            console.log(`- ${cat._id || 'No Category'}: ${cat.count} products`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
