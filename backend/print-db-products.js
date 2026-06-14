const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const MasterCatalogProduct = require("./models/MasterCatalogProduct");

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await MasterCatalogProduct.find({ 
            name: /Table Salt/i
        }).limit(5);
        console.log("DB Products:");
        products.forEach(p => {
            console.log(`- Name: ${p.name}`);
            console.log(`  imageUrl: ${p.imageUrl}`);
            console.log(`  source: ${p.source}`);
            console.log(`  barcode: ${p.barcode}`);
            console.log(`  externalId: ${p.externalId}`);
            console.log(`  shopType: ${p.shopType}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
