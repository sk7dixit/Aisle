const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config({ path: './backend/.env' });

const fixProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        const result = await Product.updateMany(
            { subCategory: { $exists: false } }, // Or $eq: null
            [{ $set: { subCategory: "$category" } }] // Aggregation pipeline to copy field
        );

        console.log(`✅ Fixed ${result.modifiedCount} products (Copied category -> subCategory)`);
        process.exit();
    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    }
};

fixProducts();
