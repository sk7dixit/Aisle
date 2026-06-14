const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Request = require("../models/Request");
const SearchAnalytics = require("../models/SearchAnalytics");
const DemandHistory = require("../models/DemandHistory");
const DemandForecast = require("../models/DemandForecast");
const SellerNotification = require("../models/SellerNotification");

const {
    aggregateDailyDemand,
    generateForecasts,
    evaluateAccuracy
} = require("../services/forecastService");

async function runTests() {
    console.log("Starting Demand Forecasting Engine automated checks...");
    
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const testEmail = "forecast_seller@test.com";

        // 1. Clean up old test data
        console.log("\n--- Cleaning up previous test data ---");
        await DemandHistory.deleteMany({});
        await DemandForecast.deleteMany({});
        await SellerNotification.deleteMany({ type: "FORECAST_ALERT" });
        await SearchAnalytics.deleteMany({ keyword: { $in: ["protein powder", "cold coffee", "energy drink"] }, city: "indore" }); // cleanup analytics
        const existingSeller = await User.findOne({ email: testEmail });
        if (existingSeller) {
            await Request.deleteMany({ sellerId: existingSeller._id });
            await User.deleteOne({ _id: existingSeller._id });
        }

        // 2. Seed Mock Seller in Indore
        console.log("\n--- Seeding Mock Seller in Indore ---");
        const seller = await User.create({
            name: "Indore Forecast Seller",
            email: testEmail,
            password: "password123",
            role: "seller",
            verificationStatus: "approved",
            shopDetails: {
                shopName: "Indore Fitness Store",
                category: "Grocery",
                shopCategory: "Grocery",
                shopType: "GROCERY_KIRANA",
                location: {
                    city: "Indore"
                },
                shopLocation: {
                    type: "Point",
                    coordinates: [75.8577, 22.7196],
                    city: "Indore"
                }
            }
        });
        console.log(`Mock Indore Seller created with ID: ${seller._id}`);

        // 3. Test Daily Demand History Aggregation
        console.log("\n--- Test 1: Daily Demand History Aggregation ---");
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Seed SearchAnalytics logs for yesterday
        console.log("Seeding search analytics logs for yesterday...");
        await SearchAnalytics.collection.insertMany([
            { keyword: "protein powder", normalizedKeyword: "protein powder", city: "indore", category: "Grocery", createdAt: yesterday },
            { keyword: "protein powder", normalizedKeyword: "protein powder", city: "indore", category: "Grocery", clickedProductId: new mongoose.Types.ObjectId(), createdAt: yesterday },
            { keyword: "cold coffee", normalizedKeyword: "cold coffee", city: "indore", category: "Bakery", createdAt: yesterday }
        ]);

        // Seed a Request for yesterday
        console.log("Seeding order requests for yesterday...");
        await Request.collection.insertOne({
            productId: new mongoose.Types.ObjectId(),
            productName: "Protein Powder",
            sellerId: seller._id,
            customerId: new mongoose.Types.ObjectId(),
            status: "PENDING",
            createdAt: yesterday,
            updatedAt: yesterday
        });

        // Run Daily Demand Aggregation
        await aggregateDailyDemand(yesterdayStr);

        // Assert aggregate history record is generated
        const historyRecord = await DemandHistory.findOne({
            keyword: "protein powder",
            city: "indore",
            date: yesterdayStr
        });

        if (!historyRecord) {
            throw new Error("FAIL: DemandHistory record was not created for yesterday.");
        }
        console.log("SUCCESS: DemandHistory record created:", historyRecord);
        if (historyRecord.searchCount !== 2) {
            throw new Error(`FAIL: Expected searchCount to be 2, got ${historyRecord.searchCount}`);
        }
        if (historyRecord.clickCount !== 1) {
            throw new Error(`FAIL: Expected clickCount to be 1, got ${historyRecord.clickCount}`);
        }
        if (historyRecord.requestCount !== 1) {
            throw new Error(`FAIL: Expected requestCount to be 1, got ${historyRecord.requestCount}`);
        }
        console.log("SUCCESS: Aggregated counts match expected values.");

        // Clear history to seed 14 days cleanly
        await DemandHistory.deleteMany({});

        // 4. Test Forecast Calculations and Seeding
        console.log("\n--- Test 2: Historical Seeding & Forecast Computation ---");
        // Running generateForecasts will trigger the 14-day history seeder automatically since history is empty
        await generateForecasts();

        const IndoreForecast = await DemandForecast.findOne({
            keyword: "protein powder",
            city: "indore"
        });

        if (!IndoreForecast) {
            throw new Error("FAIL: DemandForecast record not created.");
        }
        console.log("SUCCESS: DemandForecast record computed:", IndoreForecast);
        console.log(`- Base (Current) Demand: ${IndoreForecast.currentDemand}`);
        console.log(`- 1-Day Forecast: ${IndoreForecast.predictedDemand1Day}`);
        console.log(`- 7-Day Forecast: ${IndoreForecast.predictedDemand7Day}`);
        console.log(`- Growth Momentum: ${IndoreForecast.momentumScore}%`);
        console.log(`- Confidence Score: ${IndoreForecast.confidenceScore}%`);
        console.log(`- Trend Direction: ${IndoreForecast.trendDirection}`);

        if (IndoreForecast.momentumScore < 50) {
            throw new Error(`FAIL: Expected high momentum growth score (>50%) for protein powder, got ${IndoreForecast.momentumScore}`);
        }
        if (IndoreForecast.trendDirection !== "SPIKE") {
            throw new Error(`FAIL: Expected trend direction to be SPIKE, got ${IndoreForecast.trendDirection}`);
        }
        console.log("SUCCESS: Momentum and trend calculations look mathematically correct.");

        // 5. Test Proactive Alerts
        console.log("\n--- Test 3: Proactive Alert Dispatch ---");
        // Because "protein powder" has growth momentum > 50% (+111%), alert should have triggered for local seller
        const alert = await SellerNotification.findOne({
            sellerId: seller._id,
            type: "FORECAST_ALERT"
        });
        if (!alert) {
            throw new Error("FAIL: No FORECAST_ALERT dispatch found for Indore seller.");
        }
        console.log("SUCCESS: FORECAST_ALERT dispatched successfully to Indore seller:", alert.message);

        // 6. Test Event adjustments (Monsoon and Diwali multipliers)
        console.log("\n--- Test 4: Festive & Seasonal Event Adjustments ---");
        
        // Let's mock Date.getMonth() using prototype override to simulate October (index 9) / November (index 10)
        const originalGetMonth = Date.prototype.getMonth;
        
        // Mock Month = October (Diwali sweets & gifts multiplier 2.0x active)
        Date.prototype.getMonth = () => 9; 

        // Let's delete existing forecasts and recalculate
        await DemandForecast.deleteMany({});
        await generateForecasts();

        const diwaliForecast = await DemandForecast.findOne({
            keyword: "cold coffee", // category Bakery (subject to Diwali adjustment)
            city: "indore"
        });

        // Restore original getMonth
        Date.prototype.getMonth = originalGetMonth;

        if (!diwaliForecast) {
            throw new Error("FAIL: Could not generate forecast under Diwali month mock.");
        }
        console.log(`SUCCESS: Diwali multiplier forecast calculated. 7-Day Proj: ${diwaliForecast.predictedDemand7Day}`);
        // Let's run a comparison with non-multiplier to ensure 2.0x was applied
        // Normal predicted demand 7 day = 374 * 7 * (1 + 0.87) = 374 * 7 * 1.87 = 4895.
        // With Diwali 2.0x multiplier, it should double.
        if (diwaliForecast.predictedDemand7Day < 9000) {
            throw new Error(`FAIL: Expected 2.0x Diwali multiplier projection, got ${diwaliForecast.predictedDemand7Day}`);
        }
        console.log("SUCCESS: Diwali festive 2.0x multiplier applied correctly.");

        // 7. Test Forecast Accuracy Tracking
        console.log("\n--- Test 5: Forecast Accuracy Evaluation ---");
        
        // Let's check yesterday's actual count for Indore protein powder in history.
        // Let's update yesterday's history record to match or mismatch the prediction
        const forecastRecord = await DemandForecast.findOne({ keyword: "protein powder", city: "indore" });
        const predictedVal = forecastRecord.predictedDemand1Day; // should be around 1250 (which was yesterday's search count in seeder)

        // Let's set yesterday's history search count to something different (e.g. 850)
        await DemandHistory.updateOne(
            { keyword: "protein powder", city: "indore", date: yesterdayStr },
            { $set: { searchCount: 850 } }
        );

        // Run accuracy evaluation
        await evaluateAccuracy();

        const updatedForecast = await DemandForecast.findOne({ keyword: "protein powder", city: "indore" });
        console.log(`Updated Forecast accuracy score: ${updatedForecast.accuracyScore}%`);
        // Actual = 1000, Predicted = ~1250. Diff = 250. Error = 250/1000 = 25%. Accuracy = 75%.
        if (updatedForecast.accuracyScore < 50 || updatedForecast.accuracyScore > 90) {
            throw new Error(`FAIL: Expected accuracy score around 75-80%, got ${updatedForecast.accuracyScore}%`);
        }
        console.log("SUCCESS: Accuracy tracker works correctly.");

        // Cleanup test data
        console.log("\n--- Cleaning up test data ---");
        await DemandHistory.deleteMany({});
        await DemandForecast.deleteMany({});
        await SellerNotification.deleteMany({ type: "FORECAST_ALERT" });
        await Request.deleteMany({ sellerId: seller._id });
        await User.deleteOne({ _id: seller._id });
        console.log("Test data cleaned up successfully.");

        console.log("\nALL DEMAND FORECASTING ENGINE TESTS PASSED SUCCESSFULLY!");
        process.exit(0);

    } catch (error) {
        console.error("\nTEST SUITE RUN ENCOUNTERED AN ERROR:", error);
        process.exit(1);
    }
}

runTests();
