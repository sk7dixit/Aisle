const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { performDailyReset } = require('../utils/stockScheduler');
const connectDB = require('../config/db');

async function testDailyReset() {
    try {
        await connectDB();
        console.log("Connected to DB");

        // 1. Setup Data
        // Create a Kirana Seller
        const kiranaSeller = await User.create({
            name: "Kirana Test Seller",
            email: `kirana_${Date.now()}@test.com`,
            password: "password123",
            role: "seller",
            shopDetails: {
                shopName: "Kirana Test Shop",
                category: "Grocery"
            }
        });

        // Create a Pharmacy Seller
        const pharmacySeller = await User.create({
            name: "Pharmacy Test Seller",
            email: `pharmacy_${Date.now()}@test.com`,
            password: "password123",
            role: "seller",
            shopDetails: {
                shopName: "Pharmacy Test Shop",
                category: "Pharmacy"
            }
        });

        // Create Products
        const dailyProd = await Product.create({
            seller: kiranaSeller._id,
            name: "Milk (Daily Reset)",
            category: "Dairy",
            productType: "DAILY_ESSENTIAL",
            countInStock: 50
        });

        const standardProd = await Product.create({
            seller: kiranaSeller._id,
            name: "Cookies (Standard)",
            category: "Snacks",
            productType: "STANDARD",
            countInStock: 50
        });

        const pharmaProd = await Product.create({
            seller: pharmacySeller._id,
            name: "Aspirin (No Reset)",
            category: "Medicine",
            productType: "EXPIRY_BASED",
            countInStock: 50,
            expiryDate: new Date('2030-01-01')
        });

        console.log("Seeded test products with 50 units each.");

        // 2. Trigger Reset
        console.log("Triggering Daily Reset logic manually...");
        await performDailyReset();

        // 3. Verify
        const milk = await Product.findById(dailyProd._id);
        const cookies = await Product.findById(standardProd._id);
        const aspirin = await Product.findById(pharmaProd._id);

        let failed = false;

        if (milk.countInStock !== 0) {
            console.error(`FAIL: Milk (Daily Essential) should be 0, got ${milk.countInStock}`);
            failed = true;
        } else {
            console.log("PASS: Milk (Daily Essential) correctly reset to 0.");
        }

        if (cookies.countInStock !== 50) {
            console.error(`FAIL: Cookies (Standard) should stay 50, got ${cookies.countInStock}`);
            failed = true;
        } else {
            console.log("PASS: Cookies (Standard) remained unchanged.");
        }

        if (aspirin.countInStock !== 50) {
            console.error(`FAIL: Aspirin (Pharmacy) should stay 50, got ${aspirin.countInStock}`);
            failed = true;
        } else {
            console.log("PASS: Aspirin (Pharmacy) remained unchanged.");
        }

        // Check Audit Log
        const movement = await StockMovement.findOne({ product: dailyProd._id, reason: 'DAILY_RESET' });
        if (!movement || movement.change !== -50) {
            console.error("FAIL: Missing or incorrect StockMovement entry for daily reset.");
            failed = true;
        } else {
            console.log("PASS: StockMovement audit entry created correctly.");
        }

        // Cleanup
        await User.deleteOne({ _id: kiranaSeller._id });
        await User.deleteOne({ _id: pharmacySeller._id });
        await Product.deleteMany({ _id: { $in: [dailyProd._id, standardProd._id, pharmaProd._id] } });
        await StockMovement.deleteOne({ _id: movement?._id });

        if (failed) {
            console.error("\n❌ DAILY RESET TESTS FAILED");
            process.exit(1);
        } else {
            console.log("\n✅ ALL DAILY RESET TESTS PASSED");
            process.exit(0);
        }

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
}

testDailyReset();
