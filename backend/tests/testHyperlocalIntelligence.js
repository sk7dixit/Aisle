const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Request = require("../models/Request");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const SearchAnalytics = require("../models/SearchAnalytics");
const AreaIntelligence = require("../models/AreaIntelligence");
const AreaTrend = require("../models/AreaTrend");
const OpportunityZone = require("../models/OpportunityZone");

const {
    runHyperlocalPipeline,
    getExpansionSuggestions,
    getAreaInventorySuggestions,
    getAreaPricingRange,
    getHyperlocalForecast
} = require("../services/hyperlocalIntelligenceService");

async function runTests() {
    console.log("Starting Hyperlocal Intelligence & Area Prediction Engine automated tests...");
    
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const sellerEmail = "hyperlocal_seller@test.com";
        const customerEmail = "hyperlocal_customer@test.com";

        // 1. Clean up old test data
        console.log("\n--- Cleaning up previous test data ---");
        await AreaIntelligence.deleteMany({});
        await AreaTrend.deleteMany({});
        await OpportunityZone.deleteMany({});
        await SearchAnalytics.deleteMany({ keyword: "protein powder" });

        const existingSeller = await User.findOne({ email: sellerEmail });
        if (existingSeller) {
            await Product.deleteMany({ seller: existingSeller._id });
            await Shop.deleteMany({ owner: existingSeller._id });
            await User.deleteOne({ _id: existingSeller._id });
        }
        
        await User.deleteMany({ email: customerEmail });
        await Order.deleteMany({ billingEmail: customerEmail });
        await Request.deleteMany({ productName: "protein powder" });

        // 2. Seed Mock Seller in Indore (Vijay Nagar)
        console.log("\n--- Seeding Mock Seller ---");
        const seller = await User.create({
            name: "Vijay Nagar Seller",
            email: sellerEmail,
            password: "password123",
            role: "seller",
            verificationStatus: "approved",
            shopDetails: {
                shopName: "Indore Protein Hub",
                category: "Grocery",
                shopCategory: "Grocery",
                shopType: "GROCERY_KIRANA",
                address: "Vijay Nagar Main Road",
                city: "Indore",
                state: "Madhya Pradesh",
                location: {
                    city: "Indore"
                },
                shopLocation: {
                    type: "Point",
                    coordinates: [75.8953, 22.7533], // Vijay Nagar [Lng, Lat]
                    city: "Indore"
                }
            }
        });
        console.log(`Mock Seller created with ID: ${seller._id}`);

        const shop = await Shop.create({
            owner: seller._id,
            shopName: "Indore Protein Hub Shop",
            address: "Vijay Nagar Main Road",
            location: {
                type: "Point",
                coordinates: [75.8953, 22.7533]
            },
            contactPhone: "9999888877",
            isOpen: true
        });
        console.log(`Mock Shop created: ${shop._id}`);

        // Seed Product
        const product = await Product.create({
            seller: seller._id,
            shop: shop._id,
            name: "Protein Powder",
            sellingPrice: 1200,
            mrp: 1400,
            quantity: 2, // Low stock -> should show gap opportunities
            category: "Grocery",
            subCategory: "Nutrition",
            categorySlug: "grocery",
            shopType: "grocery_kirana",
            isAvailable: true
        });
        console.log(`Mock Product seeded: ${product.name}`);

        // 3. Seed Mock Customer in Indore (Vijay Nagar coordinates)
        console.log("\n--- Seeding Mock Customer ---");
        const customer = await User.create({
            name: "Indore Customer",
            email: customerEmail,
            password: "password123",
            role: "customer",
            customerLocation: {
                lat: 22.7533,
                lng: 75.8953,
                city: "Indore",
                state: "Madhya Pradesh",
                area: "vijay nagar",
                isGpsSet: true
            }
        });
        console.log(`Mock Customer created with ID: ${customer._id}`);

        // 4. Seed Searches, Requests, and Orders to generate scores
        console.log("\n--- Seeding Searches, Requests & Orders ---");
        
        // Recent search: today
        await SearchAnalytics.create({
            userId: customer._id,
            keyword: "protein powder",
            normalizedKeyword: "protein powder",
            city: "Indore",
            latitude: 22.7533,
            longitude: 75.8953,
            createdAt: new Date()
        });

        // Recent search 2: today
        await SearchAnalytics.create({
            userId: customer._id,
            keyword: "protein powder",
            normalizedKeyword: "protein powder",
            city: "Indore",
            latitude: 22.7530,
            longitude: 75.8950,
            createdAt: new Date()
        });

        // Prior search: 10 days ago (for growth calculations)
        await SearchAnalytics.create({
            userId: customer._id,
            keyword: "protein powder",
            normalizedKeyword: "protein powder",
            city: "Indore",
            latitude: 22.7531,
            longitude: 75.8951,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        });

        // Seed Request
        await Request.create({
            customerId: customer._id,
            sellerId: seller._id,
            productId: product._id,
            productName: "protein powder",
            category: "Grocery",
            status: "pending",
            createdAt: new Date()
        });

        // Seed Order
        await Order.create({
            customerId: customer._id,
            sellerId: seller._id,
            items: [{
                product: product._id,
                name: "protein powder",
                price: 1200,
                quantity: 1
            }],
            totalAmount: 1200,
            paymentMode: "PAY_ON_VISIT",
            paymentStatus: "PAID",
            status: "FULFILLED",
            qrCode: "test-qr-code-" + Date.now()
        });
        
        console.log("Activity logs seeded successfully.");

        // 5. Run Hyperlocal Intelligence Pipeline
        console.log("\n--- Test 1: Running Hyperlocal Engine Pipeline ---");
        await runHyperlocalPipeline();

        // 6. Verify AreaIntelligence
        console.log("\n--- Test 2: Verifying AreaIntelligence collection ---");
        const areaIntels = await AreaIntelligence.find({});
        console.log(`Successfully verified AreaIntelligence records: ${areaIntels.length} zones found.`);
        const vijayNagarIntel = areaIntels.find(a => a.area === "vijay nagar");
        if (!vijayNagarIntel) {
            throw new Error("FAIL: Vijay Nagar intelligence record missing.");
        }
        console.log(`SUCCESS: Vijay Nagar Demand Score: ${vijayNagarIntel.demandScore}, Supply Coverage: ${vijayNagarIntel.supplyScore}`);

        // 7. Verify AreaTrend
        console.log("\n--- Test 3: Verifying AreaTrend product trends ---");
        const trends = await AreaTrend.find({ area: "vijay nagar" });
        console.log(`Trends count for Vijay Nagar: ${trends.length}`);
        const proteinTrend = trends.find(t => t.product === "protein powder");
        if (!proteinTrend) {
            throw new Error("FAIL: Expected trend for 'protein powder' in Vijay Nagar.");
        }
        console.log(`SUCCESS: Found trend growth: ${proteinTrend.growth}, Score: ${proteinTrend.trendScore}`);

        // 8. Verify OpportunityZone
        console.log("\n--- Test 4: Verifying OpportunityZone supply gaps ---");
        const opZones = await OpportunityZone.find({ area: "vijay nagar" });
        console.log(`Opportunity zones in Vijay Nagar: ${opZones.length}`);
        const proteinGap = opZones.find(o => o.product === "protein powder");
        if (!proteinGap) {
            throw new Error("FAIL: Opportunity gap for 'protein powder' in Vijay Nagar missing.");
        }
        console.log(`SUCCESS: Mapped gap score: ${proteinGap.gapScore}, Opportunity Rank: ${proteinGap.opportunity}`);

        // 9. Verify Expansion Planning Suggestions
        console.log("\n--- Test 5: Verifying Seller Expansion Suggestions ---");
        const suggestions = await getExpansionSuggestions(seller._id);
        console.log("SUCCESS: Adjacent expansion recommendations: ", suggestions);
        if (suggestions.length > 0) {
            console.log(`Top recommended area: ${suggestions[0].area} (${suggestions[0].distanceKm} km away)`);
        }

        // 10. Verify Pricing Strategizer for demographic zones
        console.log("\n--- Test 6: Verifying Demographic Pricing Strategy ---");
        const studentStrategy = getAreaPricingRange("bhawarkua", "Grocery", 100);
        console.log(`Bhawarkua student discount check: min ₹${studentStrategy.optimalMin}, max ₹${studentStrategy.optimalMax}`);
        if (studentStrategy.optimalMin !== 85 || !studentStrategy.strategy.includes("Discount")) {
            throw new Error("FAIL: Bhawarkua pricing strategy did not match student discount parameters.");
        }
        console.log("SUCCESS: Bhawarkua student markdown validated.");

        const premiumStrategy = getAreaPricingRange("palasia", "Grocery", 100);
        console.log(`Palasia premium markup check: min ₹${premiumStrategy.optimalMin}, max ₹${premiumStrategy.optimalMax}`);
        if (premiumStrategy.optimalMin !== 98 || premiumStrategy.optimalMax !== 115) {
            throw new Error("FAIL: Palasia premium markup rules failed.");
        }
        console.log("SUCCESS: Palasia premium markup validated.");

        // Cleanup
        console.log("\n--- Test Cleanup: Removing Mock Records ---");
        await AreaIntelligence.deleteMany({});
        await AreaTrend.deleteMany({});
        await OpportunityZone.deleteMany({});
        await SearchAnalytics.deleteMany({ userId: customer._id });
        await Product.deleteMany({ seller: seller._id });
        await Shop.deleteMany({ owner: seller._id });
        await User.deleteOne({ _id: seller._id });
        await User.deleteOne({ _id: customer._id });
        await Order.deleteMany({ billingEmail: customerEmail });
        await Request.deleteMany({ customerId: customer._id });
        console.log("Cleanup completed.");

        console.log("\nALL HYPERLOCAL INTELLIGENCE ENGINE TESTS PASSED SUCCESSFULLY!");
        process.exit(0);

    } catch (error) {
        console.error("\nTEST SUITE RUN ENCOUNTERED AN ERROR:", error);
        process.exit(1);
    }
}

runTests();
