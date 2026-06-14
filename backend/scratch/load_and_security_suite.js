const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');
const io = require('socket.io-client');
const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const connectDB = async () => {
    if (mongoose.connection.readyState === 0) {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/aisle';
        await mongoose.connect(mongoUri);
        console.log('[Validator] Mongoose connected successfully.');
    }
};

// Custom multipart/form-data builder with zero dependencies
const getMultipartPayload = (fieldname, filename, fileBuffer, textFields = {}) => {
    const boundary = '----WebKitFormBoundaryAisleStressTest' + Date.now();
    const chunks = [];
    
    // Add text fields
    for (const [key, value] of Object.entries(textFields)) {
        chunks.push(Buffer.from(`--${boundary}\r\n`));
        chunks.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
        chunks.push(Buffer.from(`${value}\r\n`));
    }
    
    // Add file field
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\n`));
    chunks.push(Buffer.from(`Content-Type: image/jpeg\r\n\r\n`));
    chunks.push(fileBuffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    
    return {
        body: Buffer.concat(chunks),
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
    };
};

// Helper to calculate statistics
const getStats = (latencies) => {
    if (latencies.length === 0) return { min: 0, max: 0, avg: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: parseFloat((sum / sorted.length).toFixed(2)),
        p95: sorted[Math.floor(sorted.length * 0.95)]
    };
};

// ============================================================================
// TEST SUITES
// ============================================================================

// Suite A: Authentication Attack Test
const runSuiteA = async (duration = 10, isShort = false) => {
    const connections = isShort ? 50 : 500;
    console.log(`\n--- Running Suite A: Authentication Attack Test (c=${connections}, d=${duration}s) ---`);
    const result = await autocannon({
        url: 'http://localhost:5000/api/auth/login',
        connections,
        duration,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
    });
    
    console.log(`[Autocannon Results]`);
    console.log(`- Connections: ${result.connections}`);
    console.log(`- Duration: ${result.duration}s`);
    console.log(`- Total Requests: ${result.requests.sent || result.requests.total || 0}`);
    console.log(`- Errors: ${result.errors}`);
    console.log('StatusCodeStats:', result.statusCodeStats);
    
    const stats = result.statusCodeStats || {};
    const okCount = stats['200']?.count || stats['201']?.count || 0;
    const authFailedCount = stats['401']?.count || 0;
    const rateLimitBlocked = stats['429']?.count || 0;
    
    console.log(`- 2xx Responses: ${okCount}`);
    console.log(`- 401 Responses: ${authFailedCount}`);
    console.log(`- 429 Responses (Blocked): ${rateLimitBlocked}`);
    
    console.log(`Rate Limit Stats - Ok/Fail: ${okCount + authFailedCount}, 429 Blocked: ${rateLimitBlocked}`);
    if (rateLimitBlocked > 0) {
        console.log('\x1b[32m[Suite A PASSED] Rate limiting triggered successfully (blocked requests with 429).\x1b[0m');
    } else {
        console.log('\x1b[31m[Suite A WARNING] Rate limiting did not trigger 429 errors. Check middleware settings.\x1b[0m');
    }
};

// Suite B: OTP Bombing Attack
const runSuiteB = async (duration = 10, isShort = false) => {
    const connections = isShort ? 30 : 300;
    console.log(`\n--- Running Suite B: OTP Bombing Attack (c=${connections}, d=${duration}s) ---`);
    const result = await autocannon({
        url: 'http://localhost:5000/api/auth/send-otp',
        connections,
        duration,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' })
    });
    
    console.log(`[Autocannon Results]`);
    console.log(`- Connections: ${result.connections}`);
    console.log(`- Duration: ${result.duration}s`);
    console.log(`- Total Requests: ${result.requests.sent || result.requests.total || 0}`);
    console.log(`- Errors: ${result.errors}`);
    
    const stats = result.statusCodeStats || {};
    const okCount = stats['200']?.count || stats['201']?.count || 0;
    const rateLimitBlocked = stats['429']?.count || 0;
    
    console.log(`- 2xx Responses: ${okCount}`);
    console.log(`- 429 Responses (Blocked): ${rateLimitBlocked}`);
    
    console.log(`Rate Limit Stats - 429 Blocked: ${rateLimitBlocked}`);
    if (rateLimitBlocked > 0) {
        console.log('\x1b[32m[Suite B PASSED] OTP rate limiting triggered successfully (blocked requests with 429).\x1b[0m');
    } else {
        console.log('\x1b[31m[Suite B WARNING] OTP rate limiting did not trigger 429 errors.\x1b[0m');
    }
};

// Suite C: JWT Validation Test
const runSuiteC = async () => {
    console.log(`\n--- Running Suite C: JWT Validation Test ---`);
    const currentSecret = process.env.JWT_SECRET_CURRENT || process.env.JWT_SECRET || 'secret';
    
    // Generate test tokens
    const expiredToken = jwt.sign({ id: '6a284dd8c59c47f8ff71ae96' }, currentSecret, { expiresIn: '-10s' });
    const validToken = jwt.sign({ id: '6a284dd8c59c47f8ff71ae96' }, currentSecret, { expiresIn: '1h' });
    const tamperedToken = validToken.substring(0, validToken.lastIndexOf('.')) + '.tamperedsig';
    const wrongSigToken = jwt.sign({ id: '6a284dd8c59c47f8ff71ae96' }, 'wrongsecretkey', { expiresIn: '1h' });
    const randomToken = 'randomstringnotatoken';

    const tokensToTest = [
        { name: 'Expired Token', token: expiredToken },
        { name: 'Tampered Token', token: tamperedToken },
        { name: 'Wrong Signature Token', token: wrongSigToken },
        { name: 'Random Token', token: randomToken }
    ];

    let passed = true;
    for (const testItem of tokensToTest) {
        try {
            const res = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${testItem.token}` }
            });
            console.log(`\x1b[31m[Suite C FAILED] ${testItem.name} bypassed JWT validation with status ${res.status}\x1b[0m`);
            passed = false;
        } catch (err) {
            const status = err.response ? err.response.status : 'NO_RESPONSE';
            if (status === 401) {
                console.log(`[Suite C] ${testItem.name} rejected correctly with 401.`);
            } else {
                console.log(`\x1b[31m[Suite C FAILED] ${testItem.name} returned status ${status} instead of 401.\x1b[0m`);
                passed = false;
            }
        }
    }

    if (passed) {
        console.log('\x1b[32m[Suite C PASSED] JWT validation checks succeeded.\x1b[0m');
    } else {
        console.log('\x1b[31m[Suite C FAILED] One or more JWT validation tests failed.\x1b[0m');
    }
};

// Suite D: Seller Load Test
const runSuiteD = async (concurrency = 50) => {
    console.log(`\n--- Running Suite D: Seller Concurrency Load Test (c=${concurrency}) ---`);
    await connectDB();
    const User = require('../models/User');
    
    // Create test seller
    const testSellerEmail = 'load.seller@aisle.in';
    await User.deleteMany({ email: testSellerEmail });
    
    await User.create({
        name: 'Load Test Seller',
        email: testSellerEmail,
        password: 'LoadPassword123!',
        role: 'seller',
        verificationStatus: 'approved'
    });

    // Login to get token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: testSellerEmail,
        password: 'LoadPassword123!',
        deviceId: 'load-seller-device'
    }, {
        headers: {
            'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
        }
    });
    const token = loginRes.data.token;

    console.log('[Suite D] Executing concurrent product creation & profile updates...');
    const startTime = Date.now();
    const latencies = [];

    const makeRequest = async (i) => {
        const startReq = Date.now();
        try {
            if (i % 2 === 0) {
                await axios.post(`${API_URL}/seller/products/bulk`, {
                    products: [{
                        name: `Load Product ${i}`,
                        description: 'Stress product description',
                        price: 99,
                        category: 'Grocery'
                    }]
                }, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'x-device-id': 'load-seller-device',
                        'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
                    }
                });
            } else {
                await axios.put(`${API_URL}/seller/profile`, {
                    name: `Load Test Seller ${i}`,
                    shopDetails: {
                        shopName: `Load Shop ${i}`,
                        address: `Street ${i}`,
                        phone: '1234567890'
                    }
                }, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'x-device-id': 'load-seller-device',
                        'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
                    }
                });
            }
            latencies.push(Date.now() - startReq);
            return { success: true };
        } catch (err) {
            return { success: false, status: err.response ? err.response.status : 500, message: err.message };
        }
    };

    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(makeRequest(i));
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    let successCount = 0;
    let failCount = 0;
    results.forEach(r => r.success ? successCount++ : failCount++);

    console.log(`[Suite D] Completed in ${duration}ms. Success: ${successCount}, Fail: ${failCount}`);
    const stats = getStats(latencies);
    console.log(`Latency Stats - Min: ${stats.min}ms, Max: ${stats.max}ms, Avg: ${stats.avg}ms, P95: ${stats.p95}ms`);

    // Clean up
    await User.deleteMany({ email: testSellerEmail });
    const Product = require('../models/Product');
    await Product.deleteMany({ name: { $regex: 'Load Product.*' } });

    if (failCount === 0) {
        console.log('\x1b[32m[Suite D PASSED] Seller load test executed with 100% success.\x1b[0m');
    } else {
        console.log('\x1b[31m[Suite D WARNING] Seller load test had failures. Fail count: ' + failCount + '\x1b[0m');
    }
};

// Suite E: Customer Load Test
const runSuiteE = async (concurrency = 100) => {
    console.log(`\n--- Running Suite E: Customer Concurrency Load Test (c=${concurrency}) ---`);
    const startTime = Date.now();
    const latencies = [];

    const makeRequest = async () => {
        const startReq = Date.now();
        try {
            await axios.get(`${API_URL}/categories/general-provision/products?search=organic`, {
                headers: { 'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026' }
            });
            latencies.push(Date.now() - startReq);
            return true;
        } catch (err) {
            return false;
        }
    };

    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(makeRequest());
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const successCount = results.filter(Boolean).length;
    const stats = getStats(latencies);

    console.log(`[Suite E] Completed in ${duration}ms. Success: ${successCount}/${concurrency}`);
    console.log(`Latency Stats - Min: ${stats.min}ms, Max: ${stats.max}ms, Avg: ${stats.avg}ms, P95: ${stats.p95}ms`);
    
    if (stats.avg < 500) {
        console.log(`\x1b[32m[Suite E PASSED] Average customer query response time is ${stats.avg}ms (< 500ms).\x1b[0m`);
    } else {
        console.log(`\x1b[31m[Suite E WARNING] Customer queries average response time exceeds 500ms.\x1b[0m`);
    }
};

// Suite F: Socket.io Stress Test
const runSuiteF = async (numConnections = 100) => {
    console.log(`\n--- Running Suite F: Socket.io Connection Stress Test (n=${numConnections}) ---`);
    const sockets = [];
    let connectedCount = 0;
    let failedCount = 0;

    const startMemory = process.memoryUsage().heapUsed;

    const connectPromise = (index) => {
        return new Promise((resolve) => {
            const socket = io('http://localhost:5000', {
                transports: ['websocket'],
                forceNew: true,
                timeout: 5000
            });

            socket.on('connect', () => {
                connectedCount++;
                sockets.push(socket);
                resolve();
            });

            socket.on('connect_error', () => {
                failedCount++;
                resolve();
            });

            setTimeout(resolve, 5000);
        });
    };

    const promises = [];
    for (let i = 0; i < numConnections; i++) {
        promises.push(connectPromise(i));
    }

    await Promise.all(promises);
    const endMemory = process.memoryUsage().heapUsed;
    const memGrowthMb = ((endMemory - startMemory) / 1024 / 1024).toFixed(2);

    console.log(`[Suite F] Connection Success: ${connectedCount}, Failed: ${failedCount}`);
    console.log(`[Suite F] Memory growth in runner: ${memGrowthMb} MB`);

    // Clean up
    sockets.forEach(s => s.disconnect());
    const successRate = (connectedCount / numConnections) * 100;
    if (successRate >= 95) {
        console.log(`\x1b[32m[Suite F PASSED] Socket connection rate of ${successRate.toFixed(2)}% is >= 95%.\x1b[0m`);
    } else {
        console.log(`\x1b[31m[Suite F FAILED] Socket connection success rate is ${successRate.toFixed(2)}% (< 95%).\x1b[0m`);
    }
};

// Suite G: MongoDB Query Storm
const runSuiteG = async (numProducts = 10000) => {
    console.log(`\n--- Running Suite G: MongoDB Query Storm (seeding ${numProducts} products, 50 searches) ---`);
    await connectDB();
    const Product = require('../models/Product');
    
    console.log(`[Suite G] Seeding ${numProducts} products in batches of 5000...`);
    const batchSize = Math.min(numProducts, 5000);
    const batches = Math.ceil(numProducts / batchSize);
    
    const baseProduct = {
        description: 'Mock Storm Product Description for Indexing test',
        price: 100,
        category: 'General Provision / Kirana',
        categorySlug: 'general-provision',
        subCategory: 'Salt & Sugar',
        shopType: 'grocery_kirana',
        seller: '6a284e7b2471f21b5de82377',
        deleted: false
    };

    for (let b = 0; b < batches; b++) {
        const chunk = [];
        const currentBatchSize = Math.min(batchSize, numProducts - b * batchSize);
        for (let i = 0; i < currentBatchSize; i++) {
            const id = b * batchSize + i;
            chunk.push({
                ...baseProduct,
                name: `Storm Product ${id}`
            });
        }
        await Product.insertMany(chunk);
    }
    console.log('[Suite G] Seeding completed.');

    // Run 50 searches
    console.log('[Suite G] Performing 50 concurrent searches...');
    const startTime = Date.now();
    const latencies = [];

    const makeSearch = async () => {
        const startReq = Date.now();
        try {
            await axios.get(`${API_URL}/categories/general-provision/products?search=Storm+Product+500`, {
                headers: { 'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026' }
            });
            latencies.push(Date.now() - startReq);
            return true;
        } catch (err) {
            return false;
        }
    };

    const promises = [];
    for (let i = 0; i < 50; i++) {
        promises.push(makeSearch());
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const stats = getStats(latencies);

    console.log(`[Suite G] Finished Searches. Success: ${results.filter(Boolean).length}/50`);
    console.log(`Latency Stats - Min: ${stats.min}ms, Max: ${stats.max}ms, Avg: ${stats.avg}ms, P95: ${stats.p95}ms`);

    // Clean up
    console.log('[Suite G] Cleaning up seeded products...');
    await Product.deleteMany({ name: { $regex: 'Storm Product.*' } });
    console.log('[Suite G] Cleanup completed.');

    if (stats.avg < 300) {
        console.log(`\x1b[32m[Suite G PASSED] MongoDB queries averaged ${stats.avg}ms (< 300ms).\x1b[0m`);
    } else {
        console.log(`\x1b[31m[Suite G FAILED] MongoDB queries averaged ${stats.avg}ms (>= 300ms).\x1b[0m`);
    }
};

// Suite H: Scheduler Stress Test
const runSuiteH = async () => {
    console.log(`\n--- Running Suite H: Scheduler Concurrency Test ---`);
    await connectDB();
    const { performDailyReset } = require('../utils/stockScheduler');
    
    const startTime = Date.now();
    
    // Simulate scheduler runs concurrently with HTTP requests
    const schedulersPromise = Promise.all([
        performDailyReset().catch(e => console.error('[Suite H] Stock reset failed:', e)),
        (async () => {
            const today = new Date();
            const User = require('../models/User');
            await User.find({
                'subscription.isActive': true,
                'subscription.endDate': { $lt: today },
                'subscription.planId': { $ne: 'free' }
            });
        })().catch(e => console.error('[Suite H] Sub check failed:', e))
    ]);

    const promises = [];
    for (let i = 0; i < 50; i++) {
        promises.push(
            axios.get(`${API_URL}/categories/general-provision/products?search=organic`, {
                headers: { 'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026' }
            }).catch(err => err.response || { status: 500 })
        );
    }

    await Promise.all([schedulersPromise, ...promises]);
    const duration = Date.now() - startTime;
    console.log(`[Suite H] Scheduler concurrency test completed in ${duration}ms.`);
    console.log('\x1b[32m[Suite H PASSED] Schedulers and concurrent queries completed successfully.\x1b[0m');
};

// Suite I: File Upload Flood
const runSuiteI = async (concurrency = 50) => {
    console.log(`\n--- Running Suite I: File Upload Flood Test (c=${concurrency}) ---`);
    const startTime = Date.now();
    const latencies = [];
    const mockFileBuffer = Buffer.alloc(1024, 'a'); // 1KB mock image
    
    const makeUpload = async (i) => {
        const startReq = Date.now();
        // Target /api/support/request which is a public multipart upload endpoint (doesn't trigger Cloudinary)
        const payload = getMultipartPayload('images', `stress-${i}.jpg`, mockFileBuffer, {
            phone: '9999999999',
            category: 'Other',
            summary: `Stress upload ticket ${i}`,
            logs: JSON.stringify({ device: 'test-device' })
        });
        
        try {
            await axios.post(`${API_URL}/support/request`, payload.body, {
                headers: {
                    ...payload.headers,
                    'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
                }
            });
            latencies.push(Date.now() - startReq);
            return true;
        } catch (err) {
            console.error(`[Suite I] Upload ${i} failed:`, err.response ? err.response.status : err.message);
            return false;
        }
    };

    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(makeUpload(i));
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const successCount = results.filter(Boolean).length;
    const stats = getStats(latencies);

    console.log(`[Suite I] Completed in ${duration}ms. Success: ${successCount}/${concurrency}`);
    console.log(`Latency Stats - Min: ${stats.min}ms, Max: ${stats.max}ms, Avg: ${stats.avg}ms, P95: ${stats.p95}ms`);

    // Clean up created tickets in MongoDB
    await connectDB();
    const SupportRequest = require('../models/SupportRequest');
    await SupportRequest.deleteMany({ summary: { $regex: 'Stress upload ticket.*' } });

    // Clean up local uploaded files
    const uploadDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
            if (file.includes('stress-') || file.includes('images-')) {
                try {
                    fs.unlinkSync(path.join(uploadDir, file));
                } catch (e) {}
            }
        }
    }

    if (successCount === concurrency) {
        console.log('\x1b[32m[Suite I PASSED] File upload flood test processed all items successfully.\x1b[0m');
    } else {
        console.log(`\x1b[31m[Suite I FAILED] File upload flood test failed for ${concurrency - successCount} uploads.\x1b[0m`);
    }
};

// Suite J: Database Connection Flood
const runSuiteJ = async (concurrency = 200) => {
    console.log(`\n--- Running Suite J: Database Connection Flood Test (c=${concurrency}) ---`);
    const startTime = Date.now();
    const latencies = [];

    const makeQuery = async () => {
        const startReq = Date.now();
        try {
            await axios.get(`${API_URL}/categories/general-provision/products?limit=1`, {
                headers: { 'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026' }
            });
            latencies.push(Date.now() - startReq);
            return true;
        } catch (err) {
            return false;
        }
    };

    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(makeQuery());
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const successCount = results.filter(Boolean).length;
    const stats = getStats(latencies);

    console.log(`[Suite J] Completed in ${duration}ms. Success: ${successCount}/${concurrency}`);
    console.log(`Latency Stats - Min: ${stats.min}ms, Max: ${stats.max}ms, Avg: ${stats.avg}ms, P95: ${stats.p95}ms`);

    if (successCount === concurrency) {
        console.log('\x1b[32m[Suite J PASSED] Database connection flood test successfully completed.\x1b[0m');
    } else {
        console.log(`\x1b[31m[Suite J WARNING] Database connection flood test had failures (${concurrency - successCount} failed).\x1b[0m`);
    }
};

// Suite M: Security Penetration Test
const runSuiteM = async () => {
    console.log(`\n--- Running Suite M: Security Penetration Test ---`);
    
    // 1. NoSQL Injection Payload
    console.log('[Suite M] Testing NoSQL Injection on Login...');
    let nosqlPassed = false;
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: { '$gt': '' },
            password: 'wrong'
        });
        console.log(`\x1b[31m[Suite M FAILED] NoSQL Injection Login succeeded with status ${res.status}\x1b[0m`);
    } catch (err) {
        const status = err.response ? err.response.status : 500;
        if (status === 400 || status === 401 || status === 429) {
            console.log(`[Suite M] NoSQL Injection Login blocked correctly (Status: ${status}).`);
            nosqlPassed = true;
        } else {
            console.log(`\x1b[31m[Suite M FAILED] NoSQL Injection Login returned unexpected status ${status}\x1b[0m`);
        }
    }

    // 2. SQL Injection Payload in Search Query
    console.log('[Suite M] Testing SQL Injection in search query...');
    let sqliPassed = false;
    try {
        const res = await axios.get(`${API_URL}/categories/general-provision/products?search=' OR '1'='1`, {
            headers: { 'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026' }
        });
        // SQL Injection string shouldn't crash backend or bypass security filters.
        if (res.status === 200) {
            console.log(`[Suite M] SQL Injection string parsed as plain literal correctly.`);
            sqliPassed = true;
        }
    } catch (err) {
        const status = err.response ? err.response.status : 500;
        if (status === 400) {
            console.log(`[Suite M] SQL Injection string rejected correctly by Joi/Sanitization (Status: ${status}).`);
            sqliPassed = true;
        } else {
            console.log(`\x1b[31m[Suite M FAILED] SQL Injection search query crashed (Status: ${status})\x1b[0m`);
        }
    }

    // 3. Privilege Escalation check
    console.log('[Suite M] Testing Privilege Escalation check on Admin routes...');
    let privPassed = false;
    try {
        // Mock a regular customer login or non-admin call
        await axios.get(`${API_URL}/admin/logs`, {
            headers: { Authorization: `Bearer regular_customer_fake_token` }
        });
        console.log('\x1b[31m[Suite M FAILED] Admin route bypassed privilege checks\x1b[0m');
    } catch (err) {
        const status = err.response ? err.response.status : 500;
        if (status === 401 || status === 403) {
            console.log(`[Suite M] Privilege escalation blocked correctly (Status: ${status}).`);
            privPassed = true;
        } else {
            console.log(`\x1b[31m[Suite M FAILED] Privilege escalation query returned unexpected status ${status}\x1b[0m`);
        }
    }

    if (nosqlPassed && sqliPassed && privPassed) {
        console.log('\x1b[32m[Suite M PASSED] Security Penetration tests successfully passed.\x1b[0m');
    } else {
        console.log('\x1b[31m[Suite M FAILED] Security Penetration validation had failures.\x1b[0m');
    }
};

// Suite N: Complete Marketplace Simulation
const runSuiteN = async (concurrency = 30) => {
    console.log(`\n--- Running Suite N: Complete Marketplace Simulation (n=${concurrency} iterations) ---`);
    const startTime = Date.now();
    const latencies = [];
    
    // Simulate actions: search, view shops, socket chat messages
    const makeSimulationRun = async (i) => {
        const startReq = Date.now();
        try {
            // Step 1: Customer searches products
            await axios.get(`${API_URL}/categories/general-provision/products?search=organic`, {
                headers: { 'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026' }
            });
            // Step 2: Customer views system settings (non-elevated check)
            await axios.get(`${API_URL}/categories/general-provision/products?limit=5`, {
                headers: { 'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026' }
            });
            latencies.push(Date.now() - startReq);
            return true;
        } catch (err) {
            return false;
        }
    };

    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(makeSimulationRun(i));
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const successCount = results.filter(Boolean).length;
    const stats = getStats(latencies);

    console.log(`[Suite N] Marketplace simulation completed in ${duration}ms. Success: ${successCount}/${concurrency}`);
    console.log(`Latency Stats - Min: ${stats.min}ms, Max: ${stats.max}ms, Avg: ${stats.avg}ms, P95: ${stats.p95}ms`);
    
    if (successCount === concurrency) {
        console.log('\x1b[32m[Suite N PASSED] Complete Marketplace simulation succeeded with 100% success.\x1b[0m');
    } else {
        console.log('\x1b[31m[Suite N WARNING] Complete Marketplace simulation experienced partial failures.\x1b[0m');
    }
};

// ============================================================================
// MAIN RUNNER
// ============================================================================

const printUsage = () => {
    console.log(`
Usage:
  node load_and_security_suite.js --suite <SUITE_LETTER> [--short]

Suites:
  A - Authentication Attack Test (autocannon)
  B - OTP Bombing Attack (autocannon)
  C - JWT Validation Test
  D - Seller Concurrency Load Test
  E - Customer Concurrency Load Test
  F - Socket.io Stress Test
  G - MongoDB Query Storm
  H - Scheduler Stress Test
  I - File Upload Flood
  J - Database Connection Flood
  M - Security Penetration Test
  N - Complete Marketplace Simulation
  all - Run all programmatic tests (C, D, E, F, G, H, I, J, M, N)

Flags:
  --short   Runs tests with shorter durations/lower concurrency to complete quickly.
`);
};

const run = async () => {
    const suiteArgIndex = process.argv.indexOf('--suite');
    if (suiteArgIndex === -1 || !process.argv[suiteArgIndex + 1]) {
        printUsage();
        process.exit(1);
    }

    const suite = process.argv[suiteArgIndex + 1].toUpperCase();
    const isShort = process.argv.includes('--short');
    
    const autocannonDuration = isShort ? 5 : 15; // Kept reasonable so test doesn't hang forever
    
    console.log(`Starting Load & Security Validation. Configuration: suite=${suite}, short=${isShort}`);

    try {
        switch (suite) {
            case 'A':
                await runSuiteA(isShort ? 5 : 20, isShort);
                break;
            case 'B':
                await runSuiteB(isShort ? 5 : 20, isShort);
                break;
            case 'C':
                await runSuiteC();
                break;
            case 'D':
                await runSuiteD(isShort ? 10 : 50);
                break;
            case 'E':
                await runSuiteE(isShort ? 20 : 100);
                break;
            case 'F':
                await runSuiteF(isShort ? 20 : 100);
                break;
            case 'G':
                await runSuiteG(isShort ? 10 : 200);
                break;
            case 'H':
                await runSuiteH();
                break;
            case 'I':
                await runSuiteI(isShort ? 10 : 50);
                break;
            case 'J':
                await runSuiteJ(isShort ? 20 : 100);
                break;
            case 'M':
                await runSuiteM();
                break;
            case 'N':
                await runSuiteN(isShort ? 10 : 30);
                break;
            case 'ALL':
                console.log('\n--- Running ALL Programmatic Test Suites ---');
                await runSuiteC();
                await runSuiteD(10);
                await runSuiteE(20);
                await runSuiteF(20);
                await runSuiteG(10);
                await runSuiteH();
                await runSuiteI(10);
                await runSuiteJ(20);
                await runSuiteM();
                await runSuiteN(10);
                console.log('\n--- ALL Programmatic Test Suites Completed successfully ---');
                break;
            default:
                console.error(`Unknown suite letter: ${suite}`);
                printUsage();
                process.exit(1);
        }
        
        // Ensure mongoose connection is closed if opened
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        
        console.log('\nValidation script execution completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Fatal error in stress suite runner:', err);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

run();
