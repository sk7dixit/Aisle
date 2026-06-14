const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');
const Product = require('../backend/models/Product');
const ProductImageCache = require('../backend/models/ProductImageCache');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const oldUrl = 'https://images.unsplash.com/photo-1496181130204-7552cc14b1e0?w=500&fit=crop&q=80';
        const newUrl = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&fit=crop&q=80';

        const resMaster = await MasterCatalogProduct.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl: newUrl } });
        console.log('Updated MasterCatalogProduct count:', resMaster.modifiedCount);

        const resProduct = await Product.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl: newUrl } });
        console.log('Updated Product count:', resProduct.modifiedCount);

        const resCache = await ProductImageCache.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl: newUrl } });
        console.log('Updated ProductImageCache count:', resCache.modifiedCount);

        console.log("Database updates complete.");
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
