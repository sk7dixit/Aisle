const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const User = require('../backend/models/User');
const Product = require('../backend/models/Product');

const runVerification = async () => {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Finding a customer user...');
    const customer = await User.findOne({ role: 'customer' });
    if (!customer) {
        console.error('No customer found in the database!');
        process.exit(1);
    }
    console.log(`Using customer: ${customer.name} (ID: ${customer._id})`);

    // Find a product for quote request testing
    const product = await Product.findOne({ isAvailable: true, adminStatus: 'Active' });
    if (!product) {
        console.warn('Warning: No active product found. Quote request test might fail or skip.');
    } else {
        console.log(`Using product for quote test: ${product.name} (ID: ${product._id})`);
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_do_not_use_in_prod';
    const token = jwt.sign({ id: customer._id }, secret, { expiresIn: '1d' });
    console.log('Generated mock JWT Token.');

    const client = axios.create({
        baseURL: 'http://localhost:5000',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        validateStatus: () => true
    });

    console.log('\n--- VERIFYING CUSTOMER SUCCESS ENDPOINTS ---');

    // 1. GET /api/customer/alerts
    console.log('1. Testing GET /api/customer/alerts...');
    const resAlerts = await client.get('/api/customer/alerts');
    console.log(`   Response status: ${resAlerts.status}`);
    if (resAlerts.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resAlerts.status, resAlerts.data);
        process.exit(1);
    }
    console.log(`   ✓ alerts passed! Count: ${resAlerts.data.length}`);

    // 2. GET /api/customer/insights
    console.log('\n2. Testing GET /api/customer/insights...');
    const resInsights = await client.get('/api/customer/insights');
    console.log(`   Response status: ${resInsights.status}`);
    if (resInsights.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resInsights.status, resInsights.data);
        process.exit(1);
    }
    console.log('   ✓ insights passed! Keys:', Object.keys(resInsights.data));

    // 3. GET /api/customer/trending
    console.log('\n3. Testing GET /api/customer/trending...');
    const resTrending = await client.get('/api/customer/trending');
    console.log(`   Response status: ${resTrending.status}`);
    if (resTrending.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resTrending.status, resTrending.data);
        process.exit(1);
    }
    console.log('   ✓ trending passed!');

    // 4. GET /api/customer/price-drops
    console.log('\n4. Testing GET /api/customer/price-drops...');
    const resPriceDrops = await client.get('/api/customer/price-drops');
    console.log(`   Response status: ${resPriceDrops.status}`);
    if (resPriceDrops.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resPriceDrops.status, resPriceDrops.data);
        process.exit(1);
    }
    console.log(`   ✓ price-drops passed! Count: ${resPriceDrops.data.length}`);

    // 5. GET /api/customer/action-center
    console.log('\n5. Testing GET /api/customer/action-center...');
    const resActionCenter = await client.get('/api/customer/action-center');
    console.log(`   Response status: ${resActionCenter.status}`);
    if (resActionCenter.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resActionCenter.status, resActionCenter.data);
        process.exit(1);
    }
    console.log(`   ✓ action-center passed! Count: ${resActionCenter.data.length}`);

    // 6. POST /api/customer/request-quote
    if (product) {
        console.log('\n6. Testing POST /api/customer/request-quote...');
        const resQuote = await client.post('/api/customer/request-quote', {
            productId: product._id,
            targetPrice: Math.round((product.sellingPrice || product.price) * 0.9)
        });
        console.log(`   Response status: ${resQuote.status}`);
        if (resQuote.status !== 200) {
            console.error('❌ Failed! Expected 200, got', resQuote.status, resQuote.data);
            process.exit(1);
        }
        console.log('   ✓ request-quote passed! Response:', resQuote.data);
    }

    // 7. GET /api/customer/customer-health
    console.log('\n7. Testing GET /api/customer/customer-health...');
    const resHealth = await client.get('/api/customer/customer-health');
    console.log(`   Response status: ${resHealth.status}`);
    if (resHealth.status !== 200) {
        console.error('❌ Failed! Expected 200, got', resHealth.status, resHealth.data);
        process.exit(1);
    }
    console.log('   ✓ customer-health passed! Info:', resHealth.data);

    console.log('\n✨ ALL CUSTOMER SUCCESS AND PROACTIVE INTELLIGENCE ENDPOINTS ARE FUNCTIONAL! ✨');
    process.exit(0);
};

runVerification().catch(err => {
    console.error('❌ Verification script failed:', err);
    process.exit(1);
});
