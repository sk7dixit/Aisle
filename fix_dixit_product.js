const mongoose = require('mongoose');
const Product = require('./backend/models/Product');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const productId = '697c5a4e929f6331d0350548'; // Derived from debug output
        // Wait, the ID in output '697c5a4e929f6331d0350548' looks like a valid ObjectId.
        // Actually, let's find by name to be safe if ID was truncated or I copied it wrong (it looks long enough).
        // ObjectId is 24 hex chars. '697c5a4e929f6331d0350548' is 24 chars.

        const product = await Product.findOne({ name: /Rice/i, categorySlug: { $exists: false } });

        if (product) {
            console.log(`Fixing product: ${product.name}`);
            product.categorySlug = 'grocery-staples';
            product.category = 'Grocery & Staples'; // Update label to standard
            product.subCategory = 'Daily Needs & Food';
            await product.save();
            console.log("Product updated successfully with categorySlug: 'grocery-staples'");
        } else {
            console.log("No product found needing fix.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
