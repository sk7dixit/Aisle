const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { calculateStockStatus } = require('../utils/stockUtils');
const connectDB = require('../config/db');

// Mock req.user and controller-like behavior for testing the update logic
const testManualControls = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        // 1. Setup Test Seller
        const seller = await User.create({
            name: "Manual Control Tester",
            email: `manual_tester_${Date.now()}@test.com`,
            password: "password123",
            role: "seller",
            shopDetails: { shopName: "Tester Shop", category: "Grocery" }
        });

        // 2. Create Test Product
        const prod = await Product.create({
            seller: seller._id,
            name: "Manual Test Item",
            category: "General",
            countInStock: 10,
            lowStockThreshold: 5
        });

        console.log(`Initial Qty: ${prod.countInStock}`);

        // --- TEST 1: INCREMENT (+5) ---
        console.log("\nTesting Increment (+5)...");
        const adjustment = 5;
        const prevQty = prod.countInStock;
        prod.countInStock += adjustment;
        await prod.save();

        // Create log (as done in controller)
        await StockMovement.create({
            seller: seller._id,
            product: prod._id,
            change: adjustment,
            reason: 'MANUAL_ADJUST'
        });

        console.log(`New Qty: ${prod.countInStock} (Expected: 15)`);
        if (prod.countInStock !== 15) throw new Error("Increment failed");

        // --- TEST 2: SET EXACT (0) ---
        console.log("\nTesting Set Exact (0)...");
        prod.countInStock = 0;
        await prod.save();

        const status = calculateStockStatus(prod);
        console.log(`Status after setting to 0: ${status} (Expected: OUT_OF_STOCK)`);
        if (status !== 'OUT_OF_STOCK') throw new Error("Status calculation failed for manual 0");

        // --- TEST 3: PHARMACY EXPIRY SAFETY ---
        console.log("\nTesting Pharmacy Expiry Dominance...");
        const expiredMed = await Product.create({
            seller: seller._id,
            name: "Expired Manual Test",
            category: "Medicine",
            productType: "EXPIRY_BASED",
            expiryDate: new Date('2024-01-01'),
            countInStock: 0
        });

        // Try to "override" by setting huge count
        expiredMed.countInStock = 1000;
        await expiredMed.save();

        const medStatus = calculateStockStatus(expiredMed);
        console.log(`Expired Med Status with 1000 qty: ${medStatus} (Expected: OUT_OF_STOCK)`);
        if (medStatus !== 'OUT_OF_STOCK') throw new Error("Safety Guardrail Failed: High stock overrode expiration!");

        // --- TEST 4: VERIFY AUDIT LOG ---
        console.log("\nVerifying Audit Log...");
        const logs = await StockMovement.find({ product: prod._id, reason: 'MANUAL_ADJUST' });
        console.log(`Found ${logs.length} manual adjustment logs.`);
        if (logs.length === 0) throw new Error("Audit log missing");

        // Cleanup
        await User.deleteOne({ _id: seller._id });
        await Product.deleteMany({ seller: seller._id });
        await StockMovement.deleteMany({ seller: seller._id });

        console.log("\n✅ STEP 6 MANUAL CONTROLS VERIFIED SUCCESSFULLY");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ STEP 6 VERIFICATION FAILED:", err.message);
        process.exit(1);
    }
};

testManualControls();
