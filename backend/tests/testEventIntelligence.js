const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const EventIntelligence = require('../models/EventIntelligence');
const {
    seedEventIntelligenceData,
    getEventIntelligenceDashboard,
    syncEventCalendarJob,
    syncWeatherForecastJob,
    calculateEventForecastsJob,
    checkOpportunityAlertsJob
} = require('../services/eventIntelligenceService');

const runTest = async () => {
    try {
        console.log('[Test] Connecting to MongoDB...');
        await connectDB();
        console.log('[Test] MongoDB connected successfully.');

        // 1. Seed Data
        console.log('[Test] Running data seeding...');
        await seedEventIntelligenceData();
        console.log('[Test] Seeding verify: completed.');

        // 2. Fetch a seller
        console.log('[Test] Fetching a test seller from database...');
        let seller = await User.findOne({ role: 'seller' });
        if (!seller) {
            console.log('[Test] No seller found. Creating a temporary test seller...');
            seller = await User.create({
                name: 'Test Seller',
                email: 'test_event_seller@aisle.in',
                password: 'password123',
                role: 'seller',
                accountStatus: 'active',
                verificationStatus: 'approved',
                shopDetails: {
                    shopName: 'Event Test Store',
                    shopCategory: 'Grocery / Kirana',
                    city: 'Indore',
                    state: 'Madhya Pradesh',
                    rating: 4.8
                }
            });
        }
        console.log(`[Test] Test seller resolved: ${seller.email} (City: ${seller.shopDetails?.city})`);

        // 3. Test Dashboard Compilation
        console.log('[Test] Generating Event Intelligence Dashboard...');
        const dashboard = await getEventIntelligenceDashboard(seller._id);
        console.log('\n--- EVENT INTELLIGENCE DASHBOARD RESULT ---');
        console.log('Upcoming Events Count:', dashboard.upcomingEvents.length);
        console.log('Sample Event:', dashboard.upcomingEvents[0]);
        console.log('Opportunity Alerts Count:', dashboard.opportunityAlerts.length);
        console.log('Sample Alert:', dashboard.opportunityAlerts[0]);
        console.log('Seasonal Planner Count:', dashboard.seasonalPlanner.length);
        console.log('Sample Season Plan:', dashboard.seasonalPlanner[0]);
        console.log('Revenue Forecast:', dashboard.revenueForecast);
        console.log('-------------------------------------------\n');

        // 4. Test Workers
        console.log('[Test] Running calendar sync job...');
        await syncEventCalendarJob();
        
        console.log('[Test] Running weather intelligence sync job...');
        await syncWeatherForecastJob();

        console.log('[Test] Running event forecast calculation job...');
        await calculateEventForecastsJob();

        console.log('[Test] Running opportunity alerts check/notification job...');
        await checkOpportunityAlertsJob();

        console.log('[Test] All tests completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('[Test Error] Execution failed:', err);
        process.exit(1);
    }
};

runTest();
