const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const RefreshToken = require('../models/RefreshToken');
const StockMovement = require('../models/StockMovement');
const redisConfig = require('../config/redis');
const { getRedisClient, isRedisActive } = redisConfig;
const { initEventBus, publishEvent } = require('../utils/eventBus');
const searchCache = require('../utils/searchCache');
const { updateQuantity } = require('../controllers/sellerController');
const authController = require('../controllers/authController');
const crypto = require('crypto');

// Helper to delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTests = async () => {
    console.log("==================================================");
    console.log("   STARTING REDIS CONSISTENCY & STATE TESTS      ");
    console.log("==================================================\n");

    try {
        await connectDB();
        console.log("✅ MongoDB Connected successfully.");
    } catch (dbErr) {
        console.error("❌ Failed to connect to MongoDB:", dbErr.message);
        process.exit(1);
    }

    const redis = getRedisClient();
    if (!redis || !isRedisActive()) {
        console.error("❌ Redis is not active/available. Tests require Redis running.");
        process.exit(1);
    }
    console.log("✅ Redis client is ready.");

    // Initialize Event Bus to subscribe to channels
    await initEventBus();
    // Wait for subscription to establish
    await sleep(200);

    let testUser;
    let testProduct;

    try {
        // Setup clean state
        await User.deleteMany({ email: 'redis_tester@aisle.com' });
        testUser = await User.create({
            name: "Redis Tester",
            email: "redis_tester@aisle.com",
            password: "password123",
            role: "seller",
            accountStatus: "active",
            verificationStatus: "approved",
            shopDetails: {
                shopName: "Tester Shop",
                isOpen: true
            }
        });

        await Product.deleteMany({ name: 'Test Consistency Product' });
        testProduct = await Product.create({
            name: "Test Consistency Product",
            seller: testUser._id,
            mrp: 100,
            sellingPrice: 90,
            quantity: 50,
            unit: 'piece',
            productType: 'STANDARD',
            stockStatus: 'IN_STOCK',
            category: 'General Provision / Kirana',
            subCategory: 'General Provision / Kirana',
            categorySlug: 'general-provision',
            shopType: 'GROCERY_KIRANA'
        });

        console.log(`Setup complete. User: ${testUser._id}, Product: ${testProduct._id}`);

        // ==========================================
        // TEST 1: Suspend Seller Propagation
        // ==========================================
        console.log("\n--- TEST 1: Suspend Seller Event Propagation ---");
        {
            const deviceId = 'device-test-1';
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

            // Simulate session creation in Redis and MongoDB
            const sessionDetails = {
                sessionId: 'session-12345',
                userId: testUser._id.toString(),
                deviceId,
                role: testUser.role,
                expiresAt: new Date(Date.now() + 1000 * 3600).toISOString(),
                tokenHash
            };

            await redis.set(`session:${testUser._id}:${deviceId}`, JSON.stringify(sessionDetails), 'EX', 3600);
            await redis.set(`session:${tokenHash}`, JSON.stringify(sessionDetails), 'EX', 3600);
            await redis.set(`refresh:${testUser._id}:${deviceId}`, tokenHash, 'EX', 3600);
            await redis.zadd(`online:${testUser.role}`, Date.now() + 3600000, `${testUser._id}:${deviceId}`);

            await RefreshToken.create({
                _id: new mongoose.Types.ObjectId(),
                userId: testUser._id,
                tokenHash,
                deviceId,
                ipAddress: '127.0.0.1',
                expiresAt: new Date(Date.now() + 3600000)
            });

            // Spy on Socket Disconnection
            const socketConfig = require('../config/socket');
            let disconnectCalledFor = null;
            const originalDisconnectUserSockets = socketConfig.disconnectUserSockets;
            socketConfig.disconnectUserSockets = (id) => {
                disconnectCalledFor = id;
            };

            // Publish SELLER_STATUS_CHANGED event
            await publishEvent('SELLER_STATUS_CHANGED', { sellerId: testUser._id.toString(), status: 'suspended' });
            await sleep(500); // Wait for sub handler

            // Check keys in Redis
            const sessKey = await redis.get(`session:${testUser._id}:${deviceId}`);
            const hashKey = await redis.get(`session:${tokenHash}`);
            const refKey = await redis.get(`refresh:${testUser._id}:${deviceId}`);

            // Restore original socket function
            socketConfig.disconnectUserSockets = originalDisconnectUserSockets;

            if (!sessKey && !hashKey && !refKey && disconnectCalledFor === testUser._id.toString()) {
                console.log("✅ Test 1: Sessions revoked and sockets disconnected successfully.");
            } else {
                console.error("❌ Test 1 Failed:", { sessKey, hashKey, refKey, disconnectCalledFor });
            }
        }

        // ==========================================
        // TEST 2: Redis Restart Fallback (No Corruption)
        // ==========================================
        console.log("\n--- TEST 2: Redis Restart Fallback ---");
        {
            const deviceId = 'device-test-2';
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            const sessionDetails = {
                sessionId: 'session-67890',
                userId: testUser._id.toString(),
                deviceId,
                role: testUser.role,
                expiresAt: new Date(Date.now() + 1000 * 3600).toISOString(),
                tokenHash
            };

            await RefreshToken.deleteMany({ userId: testUser._id });
            await RefreshToken.create({
                _id: new mongoose.Types.ObjectId(),
                userId: testUser._id,
                tokenHash,
                deviceId,
                ipAddress: '127.0.0.1',
                expiresAt: new Date(Date.now() + 3600000)
            });

            // 2a. Verify that authController.refreshAccessToken recovers session details from MongoDB
            // when Redis is empty (mocking Redis restart where cache keys are lost)
            await redis.del(`session:${tokenHash}`);
            await redis.del(`session:${testUser._id}:${deviceId}`);
            await redis.del(`refresh:${testUser._id}:${deviceId}`);

            // Mock req & res for refreshAccessToken
            const mockReq = {
                body: { refreshToken: rawToken, deviceId },
                headers: {},
                socket: { remoteAddress: '127.0.0.1' }
            };

            let resData = null;
            let resStatus = null;
            const mockRes = {
                status: (code) => {
                    resStatus = code;
                    return { json: (data) => { resData = data; } };
                },
                json: (data) => { resData = data; }
            };

            await authController.refreshAccessToken(mockReq, mockRes);

            if (resData && resData.token && resData.refreshToken) {
                console.log("✅ Test 2a: Session successfully recovered from MongoDB fallback.");
            } else {
                console.error("❌ Test 2a Failed: Could not refresh token from Mongo fallback. Data:", resData, "Status:", resStatus);
            }

            // 2b. Verify that getActiveSessions falls back to MongoDB when Redis is inactive
            const originalIsRedisActive = redisConfig.isRedisActive;
            redisConfig.isRedisActive = () => false; // Mock Redis offline

            const mockReqSessions = {
                user: testUser,
                query: { deviceId },
                headers: {}
            };

            let sessionsResult = null;
            const mockResSessions = {
                json: (data) => { sessionsResult = data; },
                status: (code) => { return { json: () => {} }; }
            };

            await authController.getActiveSessions(mockReqSessions, mockResSessions);

            // Restore Redis Active logic
            redisConfig.isRedisActive = originalIsRedisActive;

            if (sessionsResult && sessionsResult.length > 0 && sessionsResult[0].deviceId === deviceId) {
                console.log("✅ Test 2b: getActiveSessions successfully fallback queried MongoDB.");
            } else {
                console.error("❌ Test 2b Failed. sessionsResult:", sessionsResult);
            }
        }

        // ==========================================
        // TEST 3: 100 Concurrent Stock Updates (Redlock)
        // ==========================================
        console.log("\n--- TEST 3: 100 Concurrent Stock Updates ---");
        {
            // Reset stock to 50
            testProduct.quantity = 50;
            await testProduct.save();
            await StockMovement.deleteMany({ product: testProduct._id });

            const concurrentCount = 100;
            const requests = [];

            // Trigger 100 concurrent manual quantity adjustments (+1 each)
            for (let i = 0; i < concurrentCount; i++) {
                const mockReq = {
                    user: testUser,
                    params: { id: testProduct._id.toString() },
                    body: { change: 1, reason: 'MANUAL_ADJUST', notes: `Concurrent increment test ${i}` }
                };

                let responseStatus = null;
                let responseData = null;
                const mockRes = {
                    status: (code) => {
                        responseStatus = code;
                        return { json: (data) => { responseData = data; } };
                    },
                    json: (data) => {
                        responseData = data;
                    }
                };

                // Push promise to wait for completion
                requests.push(updateQuantity(mockReq, mockRes).then(() => ({ responseStatus, responseData })));
            }

            const results = await Promise.all(requests);
            
            const successes = results.filter(r => r.responseStatus === null || r.responseStatus === 200).length;
            const conflicts = results.filter(r => r.responseStatus === 409).length;
            const failures = results.filter(r => r.responseStatus !== null && r.responseStatus !== 200 && r.responseStatus !== 409).length;

            console.log(`Concurrent execution stats: ${successes} Success, ${conflicts} Conflicts (Locked), ${failures} Failures.`);

            // Reload product from DB
            const finalProduct = await Product.findById(testProduct._id);
            const expectedStock = 50 + successes;

            if (finalProduct.quantity === expectedStock) {
                console.log(`✅ Test 3: Stock serialized correctly via Redlock. Final Stock: ${finalProduct.quantity} (Expected: ${expectedStock})`);
            } else {
                console.error(`❌ Test 3 Failed: Race condition detected. Stock is ${finalProduct.quantity}, Expected: ${expectedStock}`);
            }
        }

        // ==========================================
        // TEST 4: Product Update Cache Invalidation
        // ==========================================
        console.log("\n--- TEST 4: Product Cache Invalidation ---");
        {
            const cacheKey = 'product:details:test-product-123';
            await searchCache.set(cacheKey, { name: testProduct.name, price: 90 });

            // Verify written
            let cachedVal = await searchCache.get(cacheKey);
            if (!cachedVal) {
                console.error("❌ Test 4 Setup error: failed to set cache");
            } else {
                // Publish PRODUCT_UPDATED event
                await publishEvent('PRODUCT_UPDATED', { productId: testProduct._id.toString() });
                await sleep(500); // Wait for event to propagate and invalidate

                cachedVal = await searchCache.get(cacheKey);
                if (cachedVal === null) {
                    console.log("✅ Test 4: Cache invalidated across all nodes via event bus.");
                } else {
                    console.error("❌ Test 4 Failed: Cache still persists after invalidation event.");
                }
            }
        }

        // ==========================================
        // TEST 5: Password Reset Session Revocation
        // ==========================================
        console.log("\n--- TEST 5: Password Reset Revocation ---");
        {
            // Setup active sessions in Redis & Mongo
            const devices = ['device-reset-1', 'device-reset-2', 'device-reset-3'];
            const tokens = [];

            await RefreshToken.deleteMany({ userId: testUser._id });

            for (let d of devices) {
                const rawToken = crypto.randomBytes(32).toString('hex');
                const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
                tokens.push({ rawToken, tokenHash, deviceId: d });

                const sessionDetails = {
                    sessionId: `sess-${d}`,
                    userId: testUser._id.toString(),
                    deviceId: d,
                    role: testUser.role,
                    expiresAt: new Date(Date.now() + 1000 * 3600).toISOString(),
                    tokenHash
                };

                await redis.set(`session:${testUser._id}:${d}`, JSON.stringify(sessionDetails), 'EX', 3600);
                await redis.set(`session:${tokenHash}`, JSON.stringify(sessionDetails), 'EX', 3600);
                await redis.set(`refresh:${testUser._id}:${d}`, tokenHash, 'EX', 3600);
                await redis.zadd(`online:${testUser.role}`, Date.now() + 3600000, `${testUser._id}:${d}`);

                await RefreshToken.create({
                    _id: new mongoose.Types.ObjectId(),
                    userId: testUser._id,
                    tokenHash,
                    deviceId: d,
                    ipAddress: '127.0.0.1',
                    expiresAt: new Date(Date.now() + 3600000)
                });
            }

            // Spy on socket disconnection
            const socketConfig = require('../config/socket');
            let socketRevokedUser = null;
            const originalDisconnectUserSockets = socketConfig.disconnectUserSockets;
            socketConfig.disconnectUserSockets = (id) => {
                socketRevokedUser = id;
            };

            // Call authController.changePassword
            const mockReq = {
                user: testUser,
                body: { oldPassword: 'password123', newPassword: 'newsecurepassword123' },
                headers: {},
                socket: { remoteAddress: '127.0.0.1' }
            };

            let resStatus = null;
            let resData = null;
            const mockRes = {
                status: (code) => {
                    resStatus = code;
                    return { json: (data) => { resData = data; } };
                },
                json: (data) => { resData = data; }
            };

            await authController.changePassword(mockReq, mockRes);

            // Wait for event bus revocation event propagation
            await sleep(500);

            // Verify keys removed in Redis
            let redisAllClear = true;
            for (let t of tokens) {
                const sess = await redis.get(`session:${testUser._id}:${t.deviceId}`);
                const hash = await redis.get(`session:${t.tokenHash}`);
                const ref = await redis.get(`refresh:${testUser._id}:${t.deviceId}`);
                if (sess || hash || ref) {
                    redisAllClear = false;
                }
            }

            // Verify mongo records removed
            const dbCount = await RefreshToken.countDocuments({ userId: testUser._id });

            // Restore socket function
            socketConfig.disconnectUserSockets = originalDisconnectUserSockets;

            if (redisAllClear && dbCount === 0 && socketRevokedUser === testUser._id.toString()) {
                console.log("✅ Test 5: All sessions and refresh tokens revoked, sockets disconnected successfully.");
            } else {
                console.error("❌ Test 5 Failed:", { redisAllClear, dbCount, socketRevokedUser });
            }
        }

    } catch (testErr) {
        console.error("❌ Tests encountered error:", testErr);
    } finally {
        // Clean up test records
        if (testUser) {
            await User.deleteOne({ _id: testUser._id }).catch(() => {});
            await RefreshToken.deleteMany({ userId: testUser._id }).catch(() => {});
        }
        if (testProduct) {
            await Product.deleteOne({ _id: testProduct._id }).catch(() => {});
            await StockMovement.deleteMany({ product: testProduct._id }).catch(() => {});
        }

        // Close connections to exit process
        await mongoose.connection.close();
        if (redis) {
            redis.disconnect();
            const pub = redisConfig.getPubClient();
            const sub = redisConfig.getSubClient();
            if (pub) pub.disconnect();
            if (sub) sub.disconnect();
        }
        console.log("\n==================================================");
        console.log("             TEST EXECUTION FINISHED              ");
        console.log("==================================================");
        process.exit(0);
    }
};

runTests();
