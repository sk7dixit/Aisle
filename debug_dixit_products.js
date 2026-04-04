const mongoose = require('mongoose');
const Product = require('./backend/models/Product');
const Shop = require('./backend/models/Shop');
const User = require('./backend/models/User'); // Shop is inside User.shopDetails actually, or separate Shop model?
// Wait, in authController, shopDetails is in User. But Product has ref to 'Shop' or 'User' (seller)?
// Product schema: seller (User ref).
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Find the Seller "Dixit Mart"
        // It's likely in User.shopDetails.shopName
        const seller = await User.findOne({ "shopDetails.shopName": /Dixit Mart/i });

        if (!seller) {
            console.log("Seller 'Dixit Mart' not found in Users.");
            // Try looking for older Shop model if exists
            // const shop = await Shop.findOne({ name: /Dixit Mart/i });
        } else {
            console.log(`Found Seller: ${seller.name} (${seller._id})`);
            console.log(`Shop Name: ${seller.shopDetails.shopName}`);
            console.log(`Shop Category: ${seller.shopDetails.category}`);

            // 2. Find Products for this seller
            const products = await Product.find({ seller: seller._id });
            console.log(`Found ${products.length} products.`);

            products.forEach(p => {
                console.log("---------------------------------------------------");
                console.log(`Product: ${p.name}`);
                console.log(`ID: ${p._id}`);
                console.log(`Category (Legacy): ${p.category}`);
                console.log(`Category Slug (New): ${p.categorySlug || 'MISSING'}`);
                console.log(`Stock: ${p.countInStock || p.quantity}`);
                console.log(`Is Available: ${p.isAvailable}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
