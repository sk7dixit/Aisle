const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });

const MasterCatalogProduct = require('./backend/models/MasterCatalogProduct');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get unique shopTypes
    const shopTypes = await MasterCatalogProduct.distinct('shopType');
    console.log("Unique shopTypes in catalog:", shopTypes);
    
    for (const type of shopTypes) {
        const count = await MasterCatalogProduct.countDocuments({ shopType: type });
        console.log(`Count for ${type}:`, count);
    }
    
    // Also check if any pharmacy products exist
    const samplePharmacy = await MasterCatalogProduct.findOne({ shopType: 'pharmacy' });
    console.log("Sample pharmacy product:", samplePharmacy);
    
    process.exit(0);
}

run();
