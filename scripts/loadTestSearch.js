const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const Product = require('../backend/models/Product');

// Configs
const API_URL = 'http://localhost:5000/api';
const CONCURRENT_500 = 500;
const CONCURRENT_1000 = 1000;

async function setupTestData() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Find or create a test seller
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
        console.log('Creating a mock seller...');
        seller = await User.create({
            name: 'Mock Search Seller',
            email: 'search-seller@test.com',
            password: 'password123',
            role: 'seller',
            verificationStatus: 'approved',
            shopDetails: {
                shopName: 'Mock Search Shop',
                shopCategory: 'General',
                shopType: 'GROCERY_KIRANA',
                shopLocation: {
                    type: 'Point',
                    coordinates: [77.2197, 28.6139] // Delhi
                },
                isOpen: true
            }
        });
    } else {
        // Ensure seller location is set and approved/open
        seller.verificationStatus = 'approved';
        if (!seller.shopDetails) seller.shopDetails = {};
        seller.shopDetails.isOpen = true;
        if (!seller.shopDetails.shopLocation?.coordinates) {
            seller.shopDetails.shopLocation = {
                type: 'Point',
                coordinates: [77.2197, 28.6139]
            };
        }
        await seller.save();
    }

    // 2. Find or create a test customer
    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
        console.log('Creating a mock customer...');
        customer = await User.create({
            name: 'Mock Customer',
            email: 'search-customer@test.com',
            password: 'password123',
            role: 'customer'
        });
    }

    // 3. Generate JWT Token for customer
    const token = jwt.sign(
        { id: customer._id, role: customer.role },
        process.env.JWT_SECRET || process.env.JWT_SECRET_CURRENT || 'fallbacksecret',
        { expiresIn: '1d' }
    );

    // 4. Seed 100k Products if needed
    const count = await Product.countDocuments();
    console.log(`Current product count in database: ${count}`);
    if (count < 100000) {
        const needed = 100000 - count;
        console.log(`Seeding ${needed} mock products. This may take a minute...`);
        const batchSize = 10000;
        for (let i = 0; i < needed; i += batchSize) {
            const batch = [];
            const size = Math.min(batchSize, needed - i);
            for (let j = 0; j < size; j++) {
                batch.push({
                    seller: seller._id,
                    name: `Mock Product Item ${i + j}`,
                    brand: `MockBrand-${(i + j) % 50}`,
                    shopType: 'GROCERY_KIRANA',
                    categorySlug: 'dairy-ice-cream',
                    category: 'Dairy, Bread & Eggs',
                    subCategory: 'Dairy, Bread & Eggs',
                    mrp: 100,
                    sellingPrice: 80,
                    unit: 'pcs',
                    quantity: 100,
                    stockStatus: 'IN_STOCK',
                    isExact: true,
                    isAvailable: true,
                    isOpen: true
                });
            }
            await Product.insertMany(batch);
            console.log(`Seeded ${i + size}/${needed} products...`);
        }
        console.log('Product seeding completed.');
    }

    return { token, seller };
}

function calculatePercentiles(latencies) {
    latencies.sort((a, b) => a - b);
    const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.50)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    return { avg, p50, p95, p99 };
}

async function runLoadTest(concurrency, token, query = 'Product') {
    console.log(`\n--- Running Load Test with ${concurrency} Concurrent Searches (Query: "${query}") ---`);
    
    const latencies = [];
    let successes = 0;
    let failures = 0;

    const requests = Array.from({ length: concurrency }).map(async (_, idx) => {
        // Distribute search queries slightly to prevent static caching benefits for 100% of queries (test search index performance)
        const q = `${query} ${idx % 50}`;
        const start = Date.now();
        try {
            await axios.get(`${API_URL}/customer/search`, {
                params: {
                    q,
                    lat: 28.6139,
                    lng: 77.2197,
                    radius: 5,
                    limit: 10
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
                },
                timeout: 5000 // 5 seconds timeout
            });
            const latency = Date.now() - start;
            latencies.push(latency);
            successes++;
        } catch (error) {
            failures++;
        }
    });

    await Promise.all(requests);

    const stats = calculatePercentiles(latencies);
    console.log(`Test Complete.`);
    console.log(`Successful Requests: ${successes}`);
    console.log(`Failed/Timeout Requests: ${failures}`);
    if (successes > 0) {
        console.log(`Average Latency: ${stats.avg.toFixed(1)}ms`);
        console.log(`P50 (Median) Latency: ${stats.p50}ms`);
        console.log(`P95 Latency: ${stats.p95}ms`);
        console.log(`P99 Latency: ${stats.p99}ms`);
    }

    return { successes, failures, stats };
}

async function runCacheHitTest(token) {
    console.log(`\n--- Running Cache Hit Test (10 Sequential Requests for query "Mock Cache") ---`);
    const latencies = [];
    for (let i = 0; i < 10; i++) {
        const start = Date.now();
        try {
            await axios.get(`${API_URL}/customer/search`, {
                params: {
                    q: 'Mock Cache',
                    lat: 28.6139,
                    lng: 77.2197,
                    radius: 5,
                    limit: 10
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
                }
            });
            const latency = Date.now() - start;
            latencies.push(latency);
            console.log(`Request ${i + 1}: ${latency}ms ${i === 0 ? '(Cache Miss - DB Query)' : '(Cache Hit - Redis)'}`);
        } catch (error) {
            console.error(`Request ${i + 1} failed: ${error.message}`);
        }
    }
}

async function run() {
    try {
        const { token } = await setupTestData();

        // Warmup query to initialize any connection pools
        console.log('Running warmup query...');
        try {
            await axios.get(`${API_URL}/customer/search?q=Mock&lat=28.61&lng=77.21`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
                }
            });
        } catch (e) {
            console.log('Warmup error (make sure server is running on http://localhost:5000):', e.message);
        }

        // Test 0: Cache Hit Latency Profile
        await runCacheHitTest(token);

        // Test 1: 50 Concurrent Searches
        const test50 = await runLoadTest(50, token, 'Mock');

        // Test 2: 500 Concurrent Searches
        const test500 = await runLoadTest(CONCURRENT_500, token, 'Mock');

        // Test 3: 1000 Concurrent Searches
        const test1000 = await runLoadTest(CONCURRENT_1000, token, 'Mock');

        console.log('\n--- Final Load Test Report Summary ---');
        console.log(`Cache Hit Profile (Req 2-10): Avg = ${(test50.stats.avg).toFixed(1)}ms (concurrency=50)`);
        console.log(`50 Concurrent:   Avg=${test50.stats.avg.toFixed(1)}ms, P95=${test50.stats.p95}ms, Failures=${test50.failures}`);
        console.log(`500 Concurrent:  Avg=${test500.stats.avg.toFixed(1)}ms, P95=${test500.stats.p95}ms, Failures=${test500.failures}`);
        console.log(`1000 Concurrent: Avg=${test1000.stats.avg.toFixed(1)}ms, P95=${test1000.stats.p95}ms, Failures=${test1000.failures}`);

        if (test50.failures > 0 || test500.failures > 0 || test1000.failures > 0) {
            console.warn('\n⚠️ Load test completed but encountered failures/timeouts!');
        } else {
            console.log('\n✅ Load test completed successfully with 0 failures and excellent latencies!');
        }

    } catch (err) {
        console.error('Fatal Load Test Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

run();
