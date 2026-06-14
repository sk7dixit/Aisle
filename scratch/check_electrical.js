const mongoose = require('mongoose');
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Master catalog products for electrical_hardware_auto:");
    const counts = await MasterCatalogProduct.aggregate([
        { $match: { shopType: 'electrical_hardware_auto' } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log(JSON.stringify(counts, null, 2));

    const sample = await MasterCatalogProduct.find({ shopType: 'electrical_hardware_auto' }).limit(3);
    console.log("Sample products:", JSON.stringify(sample, null, 2));
    
    process.exit(0);
}

run();
