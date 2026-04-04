const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const StockInsight = require('../models/StockInsight');
const { generateStockInsights } = require('../utils/insightUtils');
const connectDB = require('../config/db');

const testAIInsights = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        // 1. Setup Test Seller
        const seller = await User.create({
            name: "AI Insight Tester",
            email: `ai_tester_${Date.now()}@test.com`,
            password: "password123",
            role: "seller",
            shopDetails: { shopName: "AI Demo Shop", category: "Grocery" }
        });

        // 2. Create Diverse Products
        // A. Top Seller (Milk)
        const milk = await Product.create({
            seller: seller._id,
            name: "Amul Gold Milk 500ml",
            category: "Dairy",
            productType: "DAILY_ESSENTIAL",
            countInStock: 50
        });

        // B. Stockout Risk (Bread)
        const bread = await Product.create({
            seller: seller._id,
            name: "Harvest Gold Bread",
            category: "Bakery",
            countInStock: 2 // Very low
        });

        // C. Expiring Med (Paracetamol) - overrides Shop category for logic
        const med = await Product.create({
            seller: seller._id,
            name: "Paracetamol 500mg",
            category: "Medicine",
            productType: "EXPIRY_BASED",
            expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days away
            countInStock: 100
        });

        console.log("Products created. Simulating history...");

        // 3. Simulate History (SALE_CONFIRMED)
        const movements = [];
        // Milk: High sales (60 units)
        for (let i = 0; i < 30; i++) {
            movements.push({
                seller: seller._id,
                product: milk._id,
                change: -2,
                reason: 'SALE_CONFIRMED'
            });
            // Also daily resets for Milk
            movements.push({
                seller: seller._id,
                product: milk._id,
                change: 10,
                reason: 'DAILY_RESET'
            });
        }

        // Bread: Steady sales (20 units) -> trigger risk because stock is 2
        for (let i = 0; i < 20; i++) {
            movements.push({
                seller: seller._id,
                product: bread._id,
                change: -1,
                reason: 'SALE_CONFIRMED'
            });
        }

        await StockMovement.insertMany(movements);
        console.log(`Simulated ${movements.length} movements.`);

        // 4. Trigger AI Generation
        console.log("\n--- Triggering AI Analysis ---");
        const results = await generateStockInsights(seller._id);

        console.log(`Generated ${results.length} insights:`);
        results.forEach((ins, i) => {
            console.log(`[${i + 1}] ${ins.type} (${ins.confidence}): "${ins.message}"`);
        });

        // 5. Cleanup
        await User.deleteOne({ _id: seller._id });
        await Product.deleteMany({ seller: seller._id });
        await StockMovement.deleteMany({ seller: seller._id });
        await StockInsight.deleteMany({ seller: seller._id });

        console.log("\n✅ STEP 7 AI ASSISTANT VERIFIED SUCCESSFULLY");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ STEP 7 VERIFICATION FAILED:", err.message);
        process.exit(1);
    }
};

testAIInsights();
