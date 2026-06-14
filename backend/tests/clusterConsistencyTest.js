const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const CentralEvent = require('../models/CentralEvent');
const RefreshToken = require('../models/RefreshToken');
const redisConfig = require('../config/redis');
const { getRedisClient, isRedisActive } = redisConfig;
const { initEventBus, publishEvent, handleCrossNodeEvent, catchUpEvents } = require('../utils/eventBus');
const searchCache = require('../utils/searchCache');
const crypto = require('crypto');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTests = async () => {
    console.log("==================================================");
    console.log("     STARTING CLUSTER CONSISTENCY TESTS           ");
    console.log("==================================================\n");

    try {
        await connectDB();
        console.log("✅ MongoDB Connected.");
    } catch (dbErr) {
        console.error("❌ Failed to connect to MongoDB:", dbErr.message);
        process.exit(1);
    }

    const redis = getRedisClient();
    if (!redis || !isRedisActive()) {
        console.error("❌ Redis is not active/available.");
        process.exit(1);
    }
    console.log("✅ Redis Connected.");

    await initEventBus();
    await sleep(200);

    let testUser;
    let testProduct;

    try {
        // Setup clean state
        await User.deleteMany({ email: 'cluster_tester@aisle.com' });
        testUser = await User.create({
            name: "Cluster Tester",
            email: "cluster_tester@aisle.com",
            password: "password123",
            role: "seller",
            accountStatus: "active",
            verificationStatus: "approved",
            shopDetails: {
                shopName: "Cluster Tester Shop",
                isOpen: true
            }
        });

        await Product.deleteMany({ name: 'Cluster Test Product' });
        testProduct = await Product.create({
            name: "Cluster Test Product",
            seller: testUser._id,
            mrp: 100,
            sellingPrice: 90,
            quantity: 50,
            unit: 'piece',
            productType: 'STANDARD',
            stockStatus: 'IN_STOCK',
            category: 'General Provision',
            subCategory: 'General Provision',
            categorySlug: 'general-provision',
            shopType: 'GROCERY_KIRANA'
        });

        // ==========================================
        // Test A (Product Update Cache Purge)
        // ==========================================
        console.log("\n--- Test A: Product Update Cache Purge ---");
        {
            const cacheKey = 'product:details:cluster-test-123';
            await searchCache.set(cacheKey, { name: testProduct.name, price: 90 });

            let cachedVal = await searchCache.get(cacheKey);
            if (!cachedVal) {
                console.error("❌ Cache write failed");
            } else {
                // Publish PRODUCT_UPDATED
                const startTime = Date.now();
                await publishEvent('PRODUCT_UPDATED', { productId: testProduct._id.toString(), version: testProduct.version });
                await sleep(200);

                cachedVal = await searchCache.get(cacheKey);
                const latency = Date.now() - startTime;
                if (cachedVal === null && latency < 1000) {
                    console.log(`✅ Test A Passed: Cache invalidated in ${latency}ms (< 1000ms).`);
                } else {
                    console.error(`❌ Test A Failed: Cache not purged or latency was ${latency}ms.`);
                }
            }
        }

        // ==========================================
        // Test B (Seller Suspension Session Eviction)
        // ==========================================
        console.log("\n--- Test B: Seller Suspension Session Eviction ---");
        {
            const deviceId = 'device-cluster-1';
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

            const sessionDetails = {
                sessionId: 'sess-cluster-1',
                userId: testUser._id.toString(),
                deviceId,
                role: testUser.role,
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                tokenHash
            };

            await redis.set(`session:${testUser._id}:${deviceId}`, JSON.stringify(sessionDetails), 'EX', 3600);
            await redis.set(`session:${tokenHash}`, JSON.stringify(sessionDetails), 'EX', 3600);
            await redis.set(`refresh:${testUser._id}:${deviceId}`, tokenHash, 'EX', 3600);

            // Spy on socket disconnection
            const socketConfig = require('../config/socket');
            let socketRevokedUser = null;
            const originalDisconnectUserSockets = socketConfig.disconnectUserSockets;
            socketConfig.disconnectUserSockets = (id) => {
                socketRevokedUser = id;
            };

            // Publish SELLER_SUSPENDED
            await publishEvent('SELLER_SUSPENDED', { userId: testUser._id.toString() });
            await sleep(300);

            const sessKey = await redis.get(`session:${testUser._id}:${deviceId}`);
            const hashKey = await redis.get(`session:${tokenHash}`);
            const refKey = await redis.get(`refresh:${testUser._id}:${deviceId}`);

            socketConfig.disconnectUserSockets = originalDisconnectUserSockets;

            if (!sessKey && !hashKey && !refKey && socketRevokedUser === testUser._id.toString()) {
                console.log("✅ Test B Passed: Seller sessions and sockets evicted successfully.");
            } else {
                console.error("❌ Test B Failed:", { sessKey, hashKey, refKey, socketRevokedUser });
            }
        }

        // ==========================================
        // Test C (Out of Order Rejection)
        // ==========================================
        console.log("\n--- Test C: Out of Order Rejection ---");
        {
            const partitionKey = `product:${testProduct._id.toString()}`;
            
            // Clear last timestamp and version keys
            await redis.del(`event:last_timestamp:${partitionKey}`);
            await redis.del(`event:last_version:${partitionKey}`);

            // Process a normal fresh event
            const freshEvent = {
                type: 'PRODUCT_UPDATED',
                payload: { productId: testProduct._id.toString() },
                timestamp: Date.now(),
                version: 5
            };
            
            await handleCrossNodeEvent(freshEvent);
            
            // Check stored values
            const storedTs = await redis.get(`event:last_timestamp:${partitionKey}`);
            const storedVer = await redis.get(`event:last_version:${partitionKey}`);
            console.log(`Stored state - Timestamp: ${storedTs}, Version: ${storedVer}`);

            // 1. Send older timestamp event
            const staleTsEvent = {
                type: 'PRODUCT_UPDATED',
                payload: { productId: testProduct._id.toString() },
                timestamp: Date.now() - 10000,
                version: 6
            };
            
            let invalidatedCount = 0;
            // Mock clear search cache
            const originalClear = searchCache.clear;
            searchCache.clear = async () => {
                invalidatedCount++;
            };

            await handleCrossNodeEvent(staleTsEvent);

            // 2. Send older version event
            const staleVerEvent = {
                type: 'PRODUCT_UPDATED',
                payload: { productId: testProduct._id.toString() },
                timestamp: Date.now() + 5000,
                version: 4
            };

            await handleCrossNodeEvent(staleVerEvent);
            
            searchCache.clear = originalClear;

            if (invalidatedCount === 0) {
                console.log("✅ Test C Passed: Stale timestamp and stale version events correctly rejected.");
            } else {
                console.error(`❌ Test C Failed: Event bus processed stale event! Invalidated count: ${invalidatedCount}`);
            }
        }

        // ==========================================
        // Test D (Node Catch-up Replay)
        // ==========================================
        console.log("\n--- Test D: Node Catch-up Replay ---");
        {
            await CentralEvent.deleteMany({});
            
            const partitionKey = `product:${testProduct._id.toString()}`;
            await redis.del(`event:last_timestamp:${partitionKey}`);
            await redis.del(`event:last_version:${partitionKey}`);
            
            // Create a fake event in MongoDB
            const eventTimestamp = Date.now() - 60 * 1000; // 1 minute ago
            const testEvent = await CentralEvent.create({
                type: 'PRODUCT_UPDATED',
                payload: { productId: testProduct._id.toString() },
                senderNode: 'fake-node-id',
                timestamp: eventTimestamp,
                version: 10
            });

            let invalidated = false;
            const originalClear = searchCache.clear;
            searchCache.clear = async () => {
                invalidated = true;
            };

            await catchUpEvents();
            searchCache.clear = originalClear;

            if (invalidated) {
                console.log("✅ Test D Passed: Event catch-up successfully replayed offline events.");
            } else {
                console.error("❌ Test D Failed: Offline events were not replayed.");
            }
        }

    } catch (testErr) {
        console.error("❌ Tests encountered error:", testErr);
    } finally {
        // Clean up
        if (testUser) await User.deleteOne({ _id: testUser._id }).catch(() => {});
        if (testProduct) await Product.deleteOne({ _id: testProduct._id }).catch(() => {});
        
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
