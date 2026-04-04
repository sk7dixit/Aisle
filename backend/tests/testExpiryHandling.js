const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Request = require('../models/Request');
const { calculateStockStatus, isExpired } = require('../utils/stockUtils');
const connectDB = require('../config/db');

async function testExpiry() {
    try {
        await connectDB();
        console.log("Connected to DB");

        // 1. Setup Test Data
        const pharmacySeller = await User.create({
            name: "Expiry Test Pharma",
            email: `pharma_expiry_${Date.now()}@test.com`,
            password: "password123",
            role: "seller",
            shopDetails: {
                shopName: "Pharma Expiry Shop",
                category: "Pharmacy"
            }
        });

        // Past Expiry Product
        const expiredProd = await Product.create({
            seller: pharmacySeller._id,
            name: "Expired Syrup",
            category: "Medicine",
            productType: "EXPIRY_BASED",
            countInStock: 20,
            expiryDate: new Date('2024-01-01') // Past
        });

        // Near Expiry Product (15 days from now)
        const nearDate = new Date();
        nearDate.setDate(nearDate.getDate() + 15);
        const nearProd = await Product.create({
            seller: pharmacySeller._id,
            name: "Near Expiry Pills",
            category: "Medicine",
            productType: "EXPIRY_BASED",
            countInStock: 20,
            expiryDate: nearDate
        });

        console.log("Seeded pharmacy test products.");

        // 2. Verify Backend Status Logic
        const expiredStatus = calculateStockStatus(expiredProd);
        const nearStatus = calculateStockStatus(nearProd);

        let failed = false;

        if (expiredStatus !== 'OUT_OF_STOCK') {
            console.error(`FAIL: Expired product should be OUT_OF_STOCK, got ${expiredStatus}`);
            failed = true;
        } else {
            console.log("PASS: Expired product correctly identified as OUT_OF_STOCK.");
        }

        if (nearStatus !== 'AVAILABLE') {
            // Near expiry should still be AVAILABLE (just warned on UI)
            console.error(`FAIL: Near expiry product should be AVAILABLE, got ${nearStatus}`);
            failed = true;
        } else {
            console.log("PASS: Near expiry product remains AVAILABLE.");
        }

        // 3. Verify Confirm Blocking (Mock Request)
        console.log("Attempting to simulate confirmation of expired product...");
        // Instead of full API call, we just test the isExpired check we added to requestController
        if (isExpired(expiredProd.expiryDate)) {
            console.log("PASS: isExpired utility correctly flags product for blocking.");
        } else {
            console.error("FAIL: isExpired utility failed to flag expired product.");
            failed = true;
        }

        // Cleanup
        await User.deleteOne({ _id: pharmacySeller._id });
        await Product.deleteMany({ _id: { $in: [expiredProd._id, nearProd._id] } });

        if (failed) {
            console.error("\n❌ PHARMACY EXPIRY TESTS FAILED");
            process.exit(1);
        } else {
            console.log("\n✅ ALL PHARMACY EXPIRY TESTS PASSED");
            process.exit(0);
        }

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
}

testExpiry();
