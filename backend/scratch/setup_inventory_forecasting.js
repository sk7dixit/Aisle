const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const DemandForecast = require("../models/DemandForecast");
const InventoryHistory = require("../models/InventoryHistory");
const InventoryForecast = require("../models/InventoryForecast");
const SellerNotification = require("../models/SellerNotification");

const { generateInventoryForecasts } = require("../services/inventoryForecastService");

const run = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const email = "seller@aisle.com";
        const seller = await User.findOne({ email });
        if (!seller) {
            console.error(`Seller ${email} not found.`);
            process.exit(1);
        }

        console.log(`Setting up inventory forecasting data for seller: ${seller.name} (${seller._id})`);

        // Update seller location details to इंदौर
        seller.shopDetails = seller.shopDetails || {};
        seller.shopDetails.city = "indore";
        seller.shopDetails.location = seller.shopDetails.location || {};
        seller.shopDetails.location.city = "indore";
        seller.shopDetails.shopLocation = seller.shopDetails.shopLocation || {};
        seller.shopDetails.shopLocation.city = "indore";
        await seller.save();
        console.log("Seller city updated to 'indore'.");

        // Clear existing shops, products, histories, forecasts for this seller
        console.log("Cleaning up old shops and products...");
        await Shop.deleteMany({ owner: seller._id });
        await Product.deleteMany({ seller: seller._id });
        await InventoryHistory.deleteMany({ sellerId: seller._id });
        await InventoryForecast.deleteMany({ sellerId: seller._id });
        await SellerNotification.deleteMany({ sellerId: seller._id, type: "RESTOCK_ALERT" });
        await DemandForecast.deleteMany({ keyword: "protein powder", city: "indore" });

        // Create 2 shops in Indore
        console.log("Creating 2 Indore shops...");
        const shopA = await Shop.create({
            owner: seller._id,
            shopName: "Indore Supplement Hub - Vijay Nagar",
            city: "indore",
            address: "Vijay Nagar",
            contactPhone: "9876543210",
            shopType: "GROCERY_KIRANA",
            location: {
                type: "Point",
                coordinates: [75.8975, 22.7533]
            }
        });

        const shopB = await Shop.create({
            owner: seller._id,
            shopName: "Indore Supplement Hub - Bhawarkua",
            city: "indore",
            address: "Bhawarkua",
            contactPhone: "9876543210",
            shopType: "GROCERY_KIRANA",
            location: {
                type: "Point",
                coordinates: [75.8676, 22.6896]
            }
        });

        console.log(`Created Shop A: ${shopA.shopName} (${shopA._id})`);
        console.log(`Created Shop B: ${shopB.shopName} (${shopB._id})`);

        // Create products
        console.log("Seeding products...");
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
            quantity: 500, // Shop A is overstocked
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
            quantity: 30, // Shop B is critical
            isAvailable: true
        });

        console.log(`Created Product A: ${productA.name} in Shop A, stock = ${productA.quantity}`);
        console.log(`Created Product B: ${productB.name} in Shop B, stock = ${productB.quantity}`);

        // Seed 14 days of inventory history
        console.log("Seeding 14 days of inventory history...");
        const dates = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d);
        }

        const historyDocs = [];
        for (let i = 0; i <= 14; i++) {
            const daysRemaining = 14 - i;
            
            // Shop A (Vijay Nagar): consumption 1 unit/day
            historyDocs.push({
                sellerId: seller._id,
                productId: productA._id,
                shopId: shopA._id,
                stockLevel: 500 + daysRemaining,
                timestamp: dates[i]
            });

            // Shop B (Bhawarkua): consumption 8 units/day
            historyDocs.push({
                sellerId: seller._id,
                productId: productB._id,
                shopId: shopB._id,
                stockLevel: 30 + (daysRemaining * 8),
                timestamp: dates[i]
            });
        }

        await InventoryHistory.insertMany(historyDocs);
        console.log(`Seeded ${historyDocs.length} inventory history records.`);

        // Seed Demand Forecast with momentum score 100%
        console.log("Seeding Indore demand forecast...");
        await DemandForecast.create({
            keyword: "protein powder",
            city: "indore",
            category: "Grocery",
            momentumScore: 100, // Doubles consumption rate
            currentDemand: 1000,
            predictedDemand7Day: 2000
        });

        // Run generating forecast pipeline
        console.log("Generating inventory forecasts...");
        await generateInventoryForecasts();

        // Check seeded forecast details
        const forecasts = await InventoryForecast.find({ sellerId: seller._id });
        console.log(`Successfully generated ${forecasts.length} forecasts for ${email}:`);
        forecasts.forEach(f => {
            console.log(`Product: ${f.productId}, Shop: ${f.shopId}`);
            console.log(`  Stock: ${f.currentStock}, Consumption: ${f.forecastedDailyConsumption}/day, Days remaining: ${f.daysRemaining}`);
            console.log(`  Risk level: ${f.riskLevel}, Restock Qty: ${f.recommendedRestockQuantity}`);
            if (f.transferOpportunity) {
                console.log(`  Transfer Opportunity: Move ${f.transferOpportunity.quantity} units from ${f.transferOpportunity.fromShopName} to ${f.transferOpportunity.toShopName}`);
            }
        });

        console.log("Forecasting seeding completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error setting up data:", err);
        process.exit(1);
    }
};

run();
