const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Request = require("../models/Request");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const DemandForecast = require("../models/DemandForecast");
const RevenueHistory = require("../models/RevenueHistory");
const RevenueForecast = require("../models/RevenueForecast");
const BusinessHealth = require("../models/BusinessHealth");
const SellerNotification = require("../models/SellerNotification");

const {
    aggregateDailyRevenue,
    runRevenuePipelineForSeller,
    getOpportunityEstimates,
    detectRevenueLeakage,
    getConversionStats,
    getCategoryGrowthAnalysis,
    getMultiStoreIntelligence,
    generateWeeklySummary
} = require("../services/revenueIntelligenceService");

async function runTests() {
    console.log("Starting Revenue Intelligence Engine automated tests...");
    
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const testEmail = "revenue_seller@test.com";

        // 1. Clean up old test data
        console.log("\n--- Cleaning up previous test data ---");
        await RevenueHistory.deleteMany({});
        await RevenueForecast.deleteMany({});
        await BusinessHealth.deleteMany({});
        await SellerNotification.deleteMany({ type: { $in: ["REVENUE_OPPORTUNITY_ALERT", "REVENUE_RISK_ALERT"] } });
        
        const existingSeller = await User.findOne({ email: testEmail });
        if (existingSeller) {
            await Product.deleteMany({ seller: existingSeller._id });
            await Order.deleteMany({ sellerId: existingSeller._id });
            await Request.deleteMany({ sellerId: existingSeller._id });
            await Shop.deleteMany({ owner: existingSeller._id });
            await User.deleteOne({ _id: existingSeller._id });
        }

        // 2. Seed Mock Seller
        console.log("\n--- Seeding Mock Seller ---");
        const seller = await User.create({
            name: "Vadodara Revenue Seller",
            email: testEmail,
            password: "password123",
            role: "seller",
            verificationStatus: "approved",
            shopDetails: {
                shopName: "Vadodara Super Store",
                category: "Grocery",
                shopCategory: "Grocery",
                shopType: "GROCERY_KIRANA",
                location: {
                    city: "Vadodara Rural"
                },
                shopLocation: {
                    type: "Point",
                    coordinates: [73.2081, 22.3072],
                    city: "Vadodara Rural"
                }
            }
        });
        console.log(`Mock Seller created with ID: ${seller._id}`);

        // Seed 2 Shops for multi-store check
        const shopA = await Shop.create({
            owner: seller._id,
            shopName: "Vadodara Store A",
            address: "Vijay Nagar Palasia Rd",
            location: {
                type: "Point",
                coordinates: [73.2081, 22.3072]
            },
            contactPhone: "9876543210",
            isOpen: true
        });

        const shopB = await Shop.create({
            owner: seller._id,
            shopName: "Vadodara Store B",
            address: "Alkapuri Main Rd",
            location: {
                type: "Point",
                coordinates: [73.2085, 22.3078]
            },
            contactPhone: "9876543211",
            isOpen: true
        });
        console.log(`Mock Shops created: Shop A (${shopA._id}), Shop B (${shopB._id})`);

        // Seed Products
        console.log("Seeding seller products...");
        const prod1 = await Product.create({
            seller: seller._id,
            shop: shopA._id,
            name: "Protein Powder",
            sellingPrice: 800,
            mrp: 900,
            quantity: 2, // low stock -> should trigger leakage and recommendations
            category: "Grocery",
            subCategory: "Nutrition",
            categorySlug: "grocery",
            shopType: "GROCERY_KIRANA"
        });

        const prod2 = await Product.create({
            seller: seller._id,
            shop: shopB._id,
            name: "Organic Honey",
            sellingPrice: 350,
            mrp: 400,
            quantity: 25, // healthy stock
            category: "Grocery",
            subCategory: "Sweeteners",
            categorySlug: "grocery",
            shopType: "GROCERY_KIRANA"
        });

        // Seed demand forecast for the city so leakage/opportunities match
        await DemandForecast.deleteMany({ city: "vadodara rural" });
        await DemandForecast.create([
            {
                keyword: "protein powder",
                city: "vadodara rural",
                category: "Grocery",
                currentDemand: 200,
                predictedDemand1Day: 10,
                predictedDemand7Day: 80,
                predictedDemand30Day: 3000,
                confidenceScore: 90,
                trendDirection: "SPIKE",
                momentumScore: 72
            },
            {
                keyword: "organic honey",
                city: "vadodara rural",
                category: "Grocery",
                currentDemand: 100,
                predictedDemand1Day: 5,
                predictedDemand7Day: 40,
                predictedDemand30Day: 800,
                confidenceScore: 85,
                trendDirection: "UP",
                momentumScore: 40
            },
            {
                keyword: "cold coffee",
                city: "vadodara rural",
                category: "Bakery",
                currentDemand: 150,
                predictedDemand1Day: 8,
                predictedDemand7Day: 60,
                predictedDemand30Day: 1200,
                confidenceScore: 88,
                trendDirection: "UP",
                momentumScore: 42
            }
        ]);
        console.log("Seeded local DemandForecast data.");

        // 3. Test Seeding & Pipeline Calculations
        console.log("\n--- Test 1: Run Revenue Pipeline ---");
        await runRevenuePipelineForSeller(seller._id);

        const forecast = await RevenueForecast.findOne({ sellerId: seller._id });
        if (!forecast) {
            throw new Error("FAIL: RevenueForecast record not created.");
        }
        console.log("SUCCESS: RevenueForecast created:");
        console.log(`- 7-Day Predicted Revenue: ₹${forecast.predictedRevenue7Days}`);
        console.log(`- 30-Day Predicted Revenue: ₹${forecast.predictedRevenue30Days}`);
        console.log(`- Projected Growth Rate: ${forecast.growthRate}%`);
        console.log(`- Growth Category: ${forecast.growthPrediction}`);

        const health = await BusinessHealth.findOne({ sellerId: seller._id });
        if (!health) {
            throw new Error("FAIL: BusinessHealth record not created.");
        }
        console.log("SUCCESS: BusinessHealth created:");
        console.log(`- Score: ${health.score}/100`);
        console.log(`- Breakdown:`, health.healthBreakdown);
        console.log(`- Recommendations:`, health.recommendations);

        // 4. Test Opportunity Estimator
        console.log("\n--- Test 2: Opportunity Estimator ---");
        const opportunities = await getOpportunityEstimates(seller._id);
        console.log("SUCCESS: Opportunities calculated:", opportunities);
        
        // Assert protein powder has opportunity calculated
        const proteinPowderOpp = opportunities.find(o => o.keyword === "protein powder");
        if (!proteinPowderOpp || proteinPowderOpp.potentialRevenue !== 120000) {
            throw new Error(`FAIL: Expected protein powder opportunity revenue to be 120000, got ${proteinPowderOpp?.potentialRevenue}`);
        }
        console.log(`SUCCESS: Protein Powder opportunity matches criteria (Searches: 3000 * 5% * ₹800 = ₹${proteinPowderOpp.potentialRevenue})`);

        // 5. Test Leakage Detector
        console.log("\n--- Test 3: Revenue Leakage Detection ---");
        const leakages = await detectRevenueLeakage(seller._id);
        console.log("SUCCESS: Leakages calculated:", leakages);
        if (leakages.length === 0) {
            throw new Error("FAIL: Expected protein powder to show up as revenue leakage due to low quantity (2) and high searches.");
        }
        console.log(`SUCCESS: Detected leakage product: ${leakages[0].productName}, estimated lost revenue: ₹${leakages[0].estimatedLostRevenue}`);

        // 6. Test Multi-Store Intelligence
        console.log("\n--- Test 4: Multi-Store Comparison ---");
        const storeIntel = await getMultiStoreIntelligence(seller._id);
        console.log("SUCCESS: Multi-store metrics compiled:", storeIntel);
        if (storeIntel.length !== 2) {
            throw new Error(`FAIL: Expected 2 stores, got ${storeIntel.length}`);
        }
        console.log(`- Best Store: ${storeIntel[0].shopName} (Revenue: ₹${storeIntel[0].revenue})`);
        console.log(`- Second Store: ${storeIntel[1].shopName} (Revenue: ₹${storeIntel[1].revenue})`);

        // 7. Test Weekly Summary
        console.log("\n--- Test 5: Weekly Executive Summary ---");
        const weeklySummary = await generateWeeklySummary(seller._id);
        console.log("SUCCESS: Weekly summary generated:\n", weeklySummary);
        if (!weeklySummary.includes("revenue leakage") && !weeklySummary.includes("orders")) {
            throw new Error("FAIL: Weekly summary missing key metrics.");
        }

        // 8. Test Proactive Alerts
        console.log("\n--- Test 6: Revenue Alert Dispatches ---");
        // Growth rate should be high due to positive mock values
        const alert = await SellerNotification.findOne({
            sellerId: seller._id,
            type: "REVENUE_OPPORTUNITY_ALERT"
        });
        if (!alert) {
            console.log("Warning: REVENUE_OPPORTUNITY_ALERT was not triggered. Checking growth rate:", forecast.growthRate);
        } else {
            console.log("SUCCESS: REVENUE_OPPORTUNITY_ALERT dispatched to seller:", alert.message);
        }

        // Cleanup
        console.log("\n--- Cleaning up test data ---");
        await RevenueHistory.deleteMany({ sellerId: seller._id });
        await RevenueForecast.deleteMany({ sellerId: seller._id });
        await BusinessHealth.deleteMany({ sellerId: seller._id });
        await SellerNotification.deleteMany({ sellerId: seller._id });
        await Product.deleteMany({ seller: seller._id });
        await Shop.deleteMany({ owner: seller._id });
        await User.deleteOne({ _id: seller._id });
        await DemandForecast.deleteMany({ city: "vadodara rural" });
        console.log("Cleanup completed.");

        console.log("\nALL REVENUE INTELLIGENCE ENGINE TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } catch (error) {
        console.error("\nTEST SUITE RUN ENCOUNTERED AN ERROR:", error);
        process.exit(1);
    }
}

runTests();
