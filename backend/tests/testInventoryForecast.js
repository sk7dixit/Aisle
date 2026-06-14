const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const DemandForecast = require("../models/DemandForecast");
const InventoryHistory = require("../models/InventoryHistory");
const InventoryForecast = require("../models/InventoryForecast");
const SellerNotification = require("../models/SellerNotification");

const {
    snapshotInventory,
    generateInventoryForecasts,
    evaluateInventoryAccuracy
} = require("../services/inventoryForecastService");

async function runTests() {
    console.log("Starting Inventory Forecasting Engine automated checks...");
    
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const testEmail = "inventory_seller@test.com";

        // 1. Clean up old test data
        console.log("\n--- Cleaning up previous test data ---");
        await InventoryHistory.deleteMany({});
        await InventoryForecast.deleteMany({});
        await SellerNotification.deleteMany({ type: "RESTOCK_ALERT" });
        await DemandForecast.deleteMany({ city: "indore" });
        
        const existingSeller = await User.findOne({ email: testEmail });
        if (existingSeller) {
            await Product.deleteMany({ seller: existingSeller._id });
            await Shop.deleteMany({ owner: existingSeller._id });
            await User.deleteOne({ _id: existingSeller._id });
        }

        // 2. Seed Mock Seller & Shops in Indore
        console.log("\n--- Seeding Mock Seller with Multi-Store Setup in Indore ---");
        const seller = await User.create({
            name: "Multi Store Seller",
            email: testEmail,
            password: "password123",
            role: "seller",
            verificationStatus: "approved",
            shopDetails: {
                shopName: "Indore Supplement Hub",
                category: "Grocery",
                shopCategory: "Grocery",
                shopType: "GROCERY_KIRANA",
                location: { city: "Indore" }
            }
        });

        // Seed 2 separate shops for the seller
        const shopA = await Shop.create({
            owner: seller._id,
            shopName: "Indore Supplement Hub - Vijay Nagar (Shop A)",
            city: "indore",
            address: "Vijay Nagar",
            contactPhone: "9876543210",
            shopType: "GROCERY_KIRANA",
            location: {
                type: "Point",
                coordinates: [75.8975, 22.7533] // Vijay Nagar Indore
            }
        });

        const shopB = await Shop.create({
            owner: seller._id,
            shopName: "Indore Supplement Hub - Bhawarkua (Shop B)",
            city: "indore",
            address: "Bhawarkua",
            contactPhone: "9876543210",
            shopType: "GROCERY_KIRANA",
            location: {
                type: "Point",
                coordinates: [75.8676, 22.6896] // Bhawarkua Indore
            }
        });

        console.log(`Mock Seller ID: ${seller._id}`);
        console.log(`Shop A ID: ${shopA._id}`);
        console.log(`Shop B ID: ${shopB._id}`);

        // 3. Seed Mock Products for Multi-store
        console.log("\n--- Seeding Seller Products across Shops ---");
        const productA = await Product.create({
            seller: seller._id,
            shop: shopA._id,
            name: "protein powder",
            brand: "Aisle Gym Brand",
            shopType: "grocery_kirana",
            categorySlug: "grocery",
            category: "Grocery",
            subCategory: "Fitness",
            mrp: 1500,
            sellingPrice: 1200,
            unit: "kg",
            quantity: 500, // Shop A has massive stock (overstocked)
            isAvailable: true
        });

        const productB = await Product.create({
            seller: seller._id,
            shop: shopB._id,
            name: "protein powder",
            brand: "Aisle Gym Brand",
            shopType: "grocery_kirana",
            categorySlug: "grocery",
            category: "Grocery",
            subCategory: "Fitness",
            mrp: 1500,
            sellingPrice: 1200,
            unit: "kg",
            quantity: 30, // Shop B has low stock (critical)
            isAvailable: true
        });

        console.log(`Product A (Shop A): stock = ${productA.quantity}`);
        console.log(`Product B (Shop B): stock = ${productB.quantity}`);

        // 4. Test Daily Snapshot Aggregator
        console.log("\n--- Test 1: Daily Snapshot Aggregator ---");
        await snapshotInventory();

        const snapshots = await InventoryHistory.find({ sellerId: seller._id });
        if (snapshots.length !== 2) {
            throw new Error(`FAIL: Expected 2 stock snapshot records, got ${snapshots.length}`);
        }
        console.log("SUCCESS: Daily snapshot logged all quantities correctly.");

        // Clear snapshots so we can seed 14 days cleanly
        await InventoryHistory.deleteMany({});

        // 5. Seed 14 Days History to simulate consumption
        console.log("\n--- Seeding 14 Days History for Consumption Calculations ---");
        const dates = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d);
        }

        // We want:
        // Shop A consumption: 1 unit/day (meaning stock drops from 514 to 500)
        // Shop B consumption: 8 units/day (meaning stock drops from 142 to 30)
        const historyDocs = [];
        for (let i = 0; i <= 14; i++) {
            const daysRemaining = 14 - i;
            
            // Shop A
            historyDocs.push({
                sellerId: seller._id,
                productId: productA._id,
                shopId: shopA._id,
                stockLevel: 500 + daysRemaining,
                timestamp: dates[i]
            });

            // Shop B
            historyDocs.push({
                sellerId: seller._id,
                productId: productB._id,
                shopId: shopB._id,
                stockLevel: 30 + (daysRemaining * 8),
                timestamp: dates[i]
            });
        }

        await InventoryHistory.insertMany(historyDocs);
        console.log(`Successfully seeded ${historyDocs.length} consumption history logs.`);

        // 6. Test Demand-Adjusted Multipliers
        console.log("\n--- Test 2: Demand-Adjusted Multiplier Verification ---");
        // Create a mock DemandForecast for Indore protein powder with 100% growth (momentumScore = 100)
        await DemandForecast.create({
            keyword: "protein powder",
            city: "indore",
            category: "Grocery",
            momentumScore: 100, // 100% growth -> doubles consumption rate
            currentDemand: 1000,
            predictedDemand7Day: 2000
        });

        // Run Inventory Forecast calculations
        await generateInventoryForecasts();

        // Check Shop B forecast:
        // Raw consumption = 8 units/day.
        // With 100% demand growth (multiplier = 2.0) -> Expected consumption = 16 units/day.
        const forecastB = await InventoryForecast.findOne({ productId: productB._id, shopId: shopB._id });
        if (!forecastB) {
            throw new Error("FAIL: Inventory forecast not found for Shop B.");
        }
        console.log("Shop B Forecast results:", forecastB);
        console.log(`- Raw rate: ${forecastB.dailyConsumptionRate} units/day`);
        console.log(`- Demand-Adjusted rate: ${forecastB.forecastedDailyConsumption} units/day`);
        console.log(`- Days remaining: ${forecastB.daysRemaining} days`);
        console.log(`- Risk level: ${forecastB.riskLevel}`);
        console.log(`- Recommended restock: ${forecastB.recommendedRestockQuantity} units`);

        if (forecastB.dailyConsumptionRate !== 8) {
            throw new Error(`FAIL: Expected raw consumption to be 8, got ${forecastB.dailyConsumptionRate}`);
        }
        if (forecastB.forecastedDailyConsumption !== 16) {
            throw new Error(`FAIL: Expected demand-adjusted consumption to be 16 (doubled from 8), got ${forecastB.forecastedDailyConsumption}`);
        }
        // daysRemaining = currentStock (30) / forecastedDailyConsumption (16) = 1.875 days ≈ 2 days.
        if (forecastB.daysRemaining !== 2) {
            throw new Error(`FAIL: Expected 2 days remaining, got ${forecastB.daysRemaining}`);
        }
        if (forecastB.riskLevel !== "CRITICAL") {
            throw new Error(`FAIL: Expected CRITICAL risk level since daysRemaining is < 7, got ${forecastB.riskLevel}`);
        }
        console.log("SUCCESS: Demand-adjusted and risk level calculations verified.");

        // Check Shop A forecast (Overstocked):
        // Raw consumption = 1 unit/day.
        // Adjusted consumption = 2 units/day.
        // Current Stock = 500.
        // Days remaining = 500 / 2 = 250 days.
        // Risk level should be OVERSTOCK since daysRemaining is > 90.
        const forecastA = await InventoryForecast.findOne({ productId: productA._id, shopId: shopA._id });
        if (!forecastA || forecastA.riskLevel !== "OVERSTOCK" || !forecastA.isOverstocked) {
            throw new Error(`FAIL: Expected Shop A to be flagged as OVERSTOCK, got riskLevel: ${forecastA?.riskLevel}, isOverstocked: ${forecastA?.isOverstocked}`);
        }
        console.log("SUCCESS: Overstocked flag and OVERSTOCK risk level verified.");

        // 7. Test Multi-Store internal transfer suggestion
        console.log("\n--- Test 3: Multi-Store Transfer Recommendation ---");
        // Re-read Shop B's forecast (since multi-store transfers runs at the end of generator)
        const updatedForecastB = await InventoryForecast.findOne({ productId: productB._id, shopId: shopB._id });
        console.log("Shop B Transfer opportunity:", updatedForecastB.transferOpportunity);

        if (!updatedForecastB.transferOpportunity) {
            throw new Error("FAIL: No transferOpportunity recommended on target Shop B.");
        }
        if (updatedForecastB.transferOpportunity.fromShopId.toString() !== shopA._id.toString()) {
            throw new Error("FAIL: Recommended source shop does not match Shop A.");
        }
        // Deficit = Recommended restock for Shop B = 16 * 30 - 30 = 450 units.
        // Surplus in Shop A = 500 - 2 * 30 = 440 units.
        // Recommended transfer quantity = min(Surplus, Deficit) = min(440, 450) = 440 units.
        if (updatedForecastB.transferOpportunity.quantity !== 440) {
            throw new Error(`FAIL: Expected transfer quantity of 440 units, got ${updatedForecastB.transferOpportunity.quantity}`);
        }
        console.log("SUCCESS: Multi-store transfer correctly recommends moving surplus stock from Shop A to Shop B.");

        // 8. Test Restock Alert dispatching
        console.log("\n--- Test 4: Restock Alert Notification Dispatch ---");
        const alert = await SellerNotification.findOne({
            sellerId: seller._id,
            type: "RESTOCK_ALERT"
        });
        if (!alert) {
            throw new Error("FAIL: No RESTOCK_ALERT notification dispatched.");
        }
        console.log("SUCCESS: Restock alert successfully generated:", alert.message);

        // 9. Test Accuracy Tracker
        console.log("\n--- Test 5: Accuracy Tracker ---");
        // Run accuracy tracker assuming actual stockout happened today.
        // Predicted daysRemaining was 2. Gen time was today.
        // Actual daysRemaining from gen time is 0 (since it hit 0 today).
        // Accuracy = 100 - ( |Actual - Predicted| / Actual ) * 100
        // Wait, actualDaysFromGen = 0, so accuracy = predictedDaysFromGen === 0 ? 100 : 0 => 0%.
        await evaluateInventoryAccuracy(productB._id, shopB._id);
        const accuracyForecast = await InventoryForecast.findOne({ productId: productB._id, shopId: shopB._id });
        console.log(`Evaluated accuracy score: ${accuracyForecast.accuracyScore}%`);
        if (accuracyForecast.accuracyScore !== 0) {
            throw new Error(`FAIL: Expected accuracy score to be 0 since actual days was 0 but predicted was 2, got ${accuracyForecast.accuracyScore}%`);
        }
        console.log("SUCCESS: Accuracy tracker works correctly.");

        // 10. Clean up test data
        console.log("\n--- Cleaning up test data ---");
        await InventoryHistory.deleteMany({});
        await InventoryForecast.deleteMany({});
        await SellerNotification.deleteMany({ type: "RESTOCK_ALERT" });
        await DemandForecast.deleteMany({ city: "indore" });
        await Product.deleteMany({ seller: seller._id });
        await Shop.deleteMany({ owner: seller._id });
        await User.deleteOne({ _id: seller._id });
        console.log("Test data cleaned up successfully.");

        console.log("\nALL INVENTORY FORECASTING ENGINE TESTS PASSED SUCCESSFULLY!");
        process.exit(0);

    } catch (error) {
        console.error("\nTEST SUITE RUN ENCOUNTERED AN ERROR:", error);
        process.exit(1);
    }
}

runTests();
