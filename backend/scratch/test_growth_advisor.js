const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../models/User');
const growthAdvisorService = require('../services/growthAdvisorService');
const copilotService = require('../services/copilotService');

async function run() {
    try {
        mongoose.set('autoIndex', false);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB:", mongoose.connection.name);

        const targetEmail = 'seller@aisle.com';
        const targetUser = await User.findOne({ email: targetEmail });
        if (!targetUser) {
            console.error(`ERROR: Seller ${targetEmail} not found!`);
            await mongoose.disconnect();
            return;
        }
        const sellerId = targetUser._id;
        console.log(`Testing Growth & Pricing Advisor for seller: ${targetEmail} (ID: ${sellerId})`);

        // 1. Test Seeding
        console.log("\n--- Testing Data Seeding ---");
        await growthAdvisorService.seedGrowthAdvisorData(sellerId);
        console.log("Seeding complete.");

        // 2. Test Dashboard Compiler
        console.log("\n--- Testing Dashboard Data Fetching ---");
        const dashboard = await growthAdvisorService.getGrowthAdvisorDashboard(sellerId);
        console.log("Growth Score:", dashboard.growthProfile?.growthScore);
        console.log("Weekly Growth Plan:", dashboard.growthProfile?.weeklyGrowthPlan);
        console.log(`Found ${dashboard.pricingAdvisor?.length} pricing advisor suggestions.`);
        if (dashboard.pricingAdvisor?.length > 0) {
            console.log("Sample Pricing Suggestion:", dashboard.pricingAdvisor[0]);
        }
        console.log(`Found ${dashboard.pricingAlerts?.length} dynamic pricing alerts.`);
        if (dashboard.pricingAlerts?.length > 0) {
            console.log("Sample Pricing Alert:", dashboard.pricingAlerts[0]);
        }
        console.log(`Found ${dashboard.growthInsights?.length} growth insights.`);
        if (dashboard.growthInsights?.length > 0) {
            console.log("Sample Growth Insight:", dashboard.growthInsights[0]);
        }

        // 3. Test Simulation Engine
        console.log("\n--- Testing Simulation Engine (+50% stock, Area Expansion enabled) ---");
        const simulation = await growthAdvisorService.simulateRevenueLift(sellerId, 50, true);
        console.log("Simulation Result:", simulation);

        // 4. Test AI Copilot Pricing Query
        console.log("\n--- Testing AI Copilot: Pricing Query ---");
        const pricingChatRes = await copilotService.processChat(sellerId, 'seller', 'What should I charge?');
        console.log("Copilot Answer:\n", pricingChatRes.answer);
        console.log("Copilot Suggestions:", pricingChatRes.suggestions);

        // 5. Test AI Copilot Expansion Query
        console.log("\n--- Testing AI Copilot: Expansion Query ---");
        const expansionChatRes = await copilotService.processChat(sellerId, 'seller', 'Where should I expand?');
        console.log("Copilot Answer:\n", expansionChatRes.answer);
        console.log("Copilot Suggestions:", expansionChatRes.suggestions);

        // 6. Test AI Copilot Increase Revenue Query
        console.log("\n--- Testing AI Copilot: Increase Revenue Query ---");
        const growthChatRes = await copilotService.processChat(sellerId, 'seller', 'How do I increase sales?');
        console.log("Copilot Answer:\n", growthChatRes.answer);
        console.log("Copilot Suggestions:", growthChatRes.suggestions);

        // 7. Test AI Copilot Opportunity Query
        console.log("\n--- Testing AI Copilot: Opportunity Query ---");
        const oppChatRes = await copilotService.processChat(sellerId, 'seller', 'What is my biggest opportunity?');
        console.log("Copilot Answer:\n", oppChatRes.answer);
        console.log("Copilot Suggestions:", oppChatRes.suggestions);

        console.log("\nAll backend integration tests executed successfully!");
        await mongoose.disconnect();
    } catch (err) {
        console.error("Test execution error:", err);
    }
}

run();
