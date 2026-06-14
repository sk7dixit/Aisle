const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const User = require('../backend/models/User');

const runVerification = async () => {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Finding a seller user...');
    const seller = await User.findOne({ role: 'seller' });
    if (!seller) {
        console.error('No seller found in the database!');
        process.exit(1);
    }
    console.log(`Using seller: ${seller.name} (ID: ${seller._id})`);

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_do_not_use_in_prod';
    const token = jwt.sign({ id: seller._id }, secret, { expiresIn: '1d' });
    console.log('Generated mock JWT Token.');

    const client = axios.create({
        baseURL: 'http://localhost:5000',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        validateStatus: () => true // Allow handling all status codes programmatically
    });

    console.log('\n--- VERIFYING ENDPOINTS ---');

    // 1. GET /api/commerce/dashboard
    console.log('1. Testing GET /api/commerce/dashboard...');
    const resDashboard = await client.get('/api/commerce/dashboard');
    console.log(`   Response status: ${resDashboard.status}`);
    if (resDashboard.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resDashboard.status, resDashboard.data);
        process.exit(1);
    }
    const data = resDashboard.data;
    const requiredKeys = ['healthBreakdown', 'commerceRadar', 'predictiveTimeline', 'businessHealth', 'revenueToday', 'forecastRevenue'];
    for (const key of requiredKeys) {
        if (data[key] === undefined) {
            console.error(`❌ Failed! Missing key in response: ${key}`);
            process.exit(1);
        }
    }
    console.log('   ✓ GET /api/commerce/dashboard passed! Keys verified:');
    console.log('     healthBreakdown:', data.healthBreakdown);
    console.log('     commerceRadar:', data.commerceRadar);
    console.log('     predictiveTimeline:', data.predictiveTimeline);

    // 2. POST /api/commerce/copilot
    console.log('\n2. Testing POST /api/commerce/copilot...');
    const resCopilot = await client.post('/api/commerce/copilot', { message: 'Why are sales down?' });
    console.log(`   Response status: ${resCopilot.status}`);
    if (resCopilot.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resCopilot.status, resCopilot.data);
        process.exit(1);
    }
    console.log('   ✓ POST /api/commerce/copilot passed!');
    console.log('     Response reply:', resCopilot.data.reply ? resCopilot.data.reply.substring(0, 80) + '...' : resCopilot.data);

    // 3. PUT /api/seller/automation-mode
    console.log('\n3. Testing PUT /api/seller/automation-mode...');
    const resAutoMode = await client.put('/api/seller/automation-mode', { automationMode: 'AUTONOMOUS' });
    console.log(`   Response status: ${resAutoMode.status}`);
    if (resAutoMode.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resAutoMode.status, resAutoMode.data);
        process.exit(1);
    }
    console.log('   ✓ PUT /api/seller/automation-mode passed!');
    console.log('     Response message:', resAutoMode.data);

    // Verify it was updated in DB
    const updatedUser = await User.findById(seller._id);
    console.log(`     DB automationMode: ${updatedUser.shopDetails.automationMode}`);
    if (updatedUser.shopDetails.automationMode !== 'AUTONOMOUS') {
        console.error('❌ Failed! Database did not update automationMode to AUTONOMOUS');
        process.exit(1);
    }

    // 4. GET /api/support/followup
    console.log('\n4. Testing GET /api/support/followup...');
    const resFollowup = await client.get('/api/support/followup');
    console.log(`   Response status: ${resFollowup.status}`);
    if (resFollowup.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resFollowup.status, resFollowup.data);
        process.exit(1);
    }
    console.log('   ✓ GET /api/support/followup passed!');

    // 5. GET /api/seller/support/context
    console.log('\n5. Testing GET /api/seller/support/context...');
    const resContext = await client.get('/api/seller/support/context');
    console.log(`   Response status: ${resContext.status}`);
    if (resContext.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resContext.status, resContext.data);
        process.exit(1);
    }
    console.log('   ✓ GET /api/seller/support/context passed!');

    // 6. GET /api/seller/support/history
    console.log('\n6. Testing GET /api/seller/support/history...');
    const resHistory = await client.get('/api/seller/support/history');
    console.log(`   Response status: ${resHistory.status}`);
    if (resHistory.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resHistory.status, resHistory.data);
        process.exit(1);
    }
    console.log('   ✓ GET /api/seller/support/history passed!');

    // 7. GET /api/seller/support/analytics
    console.log('\n7. Testing GET /api/seller/support/analytics...');
    const resAnalytics = await client.get('/api/seller/support/analytics');
    console.log(`   Response status: ${resAnalytics.status}`);
    if (resAnalytics.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resAnalytics.status, resAnalytics.data);
        process.exit(1);
    }
    console.log('   ✓ GET /api/seller/support/analytics passed!');

    console.log('\n✨ ALL ENDPOINTS ARE RESOLVED AND RUNNING PROPERLY! NO MORE 404s! ✨');
    process.exit(0);
};

runVerification().catch(err => {
    console.error('❌ Script failed with error:', err);
    process.exit(1);
});
