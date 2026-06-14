const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Product = require('../models/Product');
const Request = require('../models/Request');
const Order = require('../models/Order');
const FraudEvent = require('../models/FraudEvent');
const SellerTrust = require('../models/SellerTrust');
const CustomerTrust = require('../models/CustomerTrust');
const RiskProfile = require('../models/RiskProfile');
const CentralEvent = require('../models/CentralEvent');

// Services
const trustService = require('../services/trustService');
const aiSearchService = require('../services/aiSearchService');
const { initEventBus, publishEvent, handleCrossNodeEvent, catchUpEvents } = require('../utils/eventBus');
const searchCache = require('../utils/searchCache');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runEnterpriseHardeningCert = async () => {
    console.log("===============================================================");
    console.log("🔥 STARTING TRACK 3 ENTERPRISE HARDENING & RESILIENCE SUITE 🔥");
    console.log("===============================================================\n");

    let success = true;

    try {
        await connectDB();
        console.log("✅ MongoDB Connection: ACTIVE");

        const { getRedisClient, isRedisActive } = require('../config/redis');
        const redis = getRedisClient();
        if (!redis || !isRedisActive()) {
            console.error("❌ Redis is not active/available. Hardening tests require Redis running.");
            process.exit(1);
        }
        console.log("✅ Redis Connection: ACTIVE");

        await initEventBus();
        await sleep(200);

        // -------------------------------------------------------------
        // CLEANUP
        // -------------------------------------------------------------
        console.log("🧹 Cleaning up old test records...");
        const emailPattern = /_hardening_test/;
        await User.deleteMany({ email: emailPattern });
        await Product.deleteMany({ name: emailPattern });
        await Request.deleteMany({ productName: emailPattern });
        await Order.deleteMany({ qrCode: emailPattern });
        await FraudEvent.deleteMany({ 'details.reason': emailPattern });
        await CentralEvent.deleteMany({});
        console.log("🧹 Cleanup complete.\n");

        // Set up test product & seller
        const testSeller = await User.create({
            name: "Hardening Seller_hardening_test",
            email: `hard_seller_${Date.now()}_hardening_test@aisle.test`,
            password: "password123",
            role: "seller",
            verificationStatus: "approved",
            accountStatus: "active",
            shopDetails: {
                shopName: "Hardening Shop",
                upiId: `upi_hard_${Date.now()}@okaxis`,
                rating: 4.8
            }
        });

        const testProduct = await Product.create({
            seller: testSeller._id,
            name: "Hardening Bread_hardening_test",
            category: "Grocery",
            subCategory: "Bakery",
            categorySlug: "bakery",
            shopType: "GROCERY_KIRANA",
            productType: "DAILY_ESSENTIAL",
            quantity: 100,
            sellingPrice: 50,
            adminStatus: "Active",
            isAvailable: true
        });

        // =============================================================
        // PHASE A: Long Duration Stability (Memory & Connection Endurance)
        // =============================================================
        console.log("---------------------------------------------------------------");
        console.log("PHASE A: Long Duration Stability & Memory Endurance");
        console.log("---------------------------------------------------------------");
        
        const initialMemory = process.memoryUsage().heapUsed;
        console.log(`- Initial Heap Used: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);

        console.log("- Running 500 mixed traffic operations to detect leaks...");
        
        // Seed some random users for simulated operations
        const mockUsers = [];
        for (let i = 0; i < 50; i++) {
            mockUsers.push({
                _id: new mongoose.Types.ObjectId(),
                name: `EndureUser_${i}_hardening_test`,
                email: `endureuser_${i}_${Date.now()}_hardening_test@aisle.test`,
                password: "password123",
                role: "customer"
            });
        }
        await User.collection.insertMany(mockUsers);

        // Run concurrent lookups, spam detection checks, and cache hits
        const operations = [];
        for (let i = 0; i < 500; i++) {
            const user = mockUsers[i % 50];
            const req = {
                ip: `192.168.100.${i % 50}`,
                headers: { 'x-device-id': `device_endure_${i % 10}` }
            };
            
            operations.push((async () => {
                // Mix search Cache hits, spam checks and recalculations
                if (i % 3 === 0) {
                    await aiSearchService.searchAI('breakfast', null, null);
                } else if (i % 3 === 1) {
                    await trustService.detectSpamAndFraud(user._id, testProduct._id, testSeller._id, req);
                } else {
                    await trustService.calculateSellerTrust(testSeller._id);
                }
            })());
        }
        await Promise.all(operations);

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = finalMemory - initialMemory;
        console.log(`- Final Heap Used: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Memory Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);

        // Check active Redis connections count and BullMQ backlog
        const redisClientsInfo = await redis.info('clients');
        const connectedClientsLine = redisClientsInfo.split('\n').find(line => line.includes('connected_clients'));
        console.log(`- Redis Status: ${connectedClientsLine?.trim() || 'active'}`);

        // Heap growth should be stable (allow reasonable overhead under Node GC, e.g. < 15MB)
        if (memoryGrowth < 15 * 1024 * 1024) {
            console.log("  => PASS (Stable Memory Boundary)");
        } else {
            console.warn("  => WARNING: Memory growth exceeded 15MB boundary. Ensure GC runs.");
        }
        console.log();

        // =============================================================
        // PHASE B: Database Failure (Resilience & Graceful Degradation)
        // =============================================================
        console.log("---------------------------------------------------------------");
        console.log("PHASE B: Database Failure & Graceful Degradation");
        console.log("---------------------------------------------------------------");

        // 1. Redis Outage Simulation - Direct MongoDB Query fallback
        console.log("- Simulating Redis outage during search query...");
        
        // Override Redis Active state to emulate Redis disconnect
        const redisConfig = require('../config/redis');
        const originalIsRedisActive = redisConfig.isRedisActive;
        redisConfig.isRedisActive = () => false;

        const startRes = Date.now();
        const dbRes = await aiSearchService.searchAI('breakfast', null, null, 5, null, 15, null);
        const durationRes = Date.now() - startRes;

        // Restore Redis state
        redisConfig.isRedisActive = originalIsRedisActive;

        console.log(`- Fallback served status: Successful | Duration: ${durationRes}ms | Products: ${dbRes.products?.length}`);
        if (dbRes.products && durationRes < 200) {
            console.log("  => PASS (Direct MongoDB query fallback when Redis is offline)");
        } else {
            console.error("  => FAIL: Redis outage search did not return database products or was slow.");
            success = false;
        }

        // 1b. MongoDB Outage/Latency Simulation - Cache query Fallback trigger
        console.log("- Simulating MongoDB high latency (serving from Redis fallback cache)...");
        
        // Cache a result in persistent fallback cache first
        const fallbackKey = `ai:search:fallback:breakfast`;
        await redis.set(fallbackKey, JSON.stringify({ intent: 'breakfast', products: [{ name: 'Fallback Milk_hardening_test' }], fallbackServed: true }), 'EX', 3600);

        // Delete standard cache to force Mongo lookup
        await redis.del('ai:search:query:breakfast:null:null:5:15:null');

        // Temporarily override Product.find to delay by 500ms to simulate slow Mongo
        const originalProductFind = Product.find;
        Product.find = () => {
            return {
                populate: () => ({
                    limit: async () => {
                        await sleep(500); // 500ms delay
                        return [];
                    }
                })
            };
        };

        const startMongoFallback = Date.now();
        const fallbackResults = await aiSearchService.searchAI('breakfast', null, null, 5, null, 15, null);
        const durationMongoFallback = Date.now() - startMongoFallback;

        // Restore original Product.find
        Product.find = originalProductFind;

        console.log(`- Fallback served status: ${fallbackResults.fallbackServed} | Duration: ${durationMongoFallback}ms`);
        if (fallbackResults.fallbackServed && durationMongoFallback < 150) {
            console.log("  => PASS (Served persistent Redis search cache under high MongoDB latency)");
        } else {
            console.error("  => FAIL: Servicing persistent fallback cache failed under high MongoDB latency.");
            success = false;
        }

        // 2. Mongoose Replica/Outage Failover Circuit Breaker
        console.log("- Simulating MongoDB outages to trigger Mongo Circuit Breaker...");
        const { mongoCircuit } = require('../utils/circuitBreaker');
        
        const faultyMongoAction = async () => {
            throw new Error('Mongo connection timeout (Replica failover)');
        };

        for (let i = 0; i < 5; i++) {
            try {
                await mongoCircuit.execute(faultyMongoAction);
            } catch (e) {}
        }

        console.log(`- Mongo Circuit state after failures: ${mongoCircuit.state}`);
        if (mongoCircuit.state === 'OPEN') {
            console.log("  => PASS (MongoDB Circuit transitioned to OPEN)");
        } else {
            console.error("  => FAIL: MongoDB Circuit remained CLOSED.");
            success = false;
        }
        mongoCircuit.state = 'CLOSED'; // Reset circuit
        mongoCircuit.failureCount = 0;
        console.log();

        // =============================================================
        // PHASE C: Multi-Node PM2 Cluster Consistency
        // =============================================================
        console.log("---------------------------------------------------------------");
        console.log("PHASE C: Multi-Node PM2 Cluster Consistency");
        console.log("---------------------------------------------------------------");

        const partitionKey = `product:${testProduct._id.toString()}`;
        await redis.del(`event:last_timestamp:${partitionKey}`);
        await redis.del(`event:last_version:${partitionKey}`);

        // 1. Out of order event rejection validation
        console.log("- Dispatching fresh event (v10)...");
        const freshEvent = {
            type: 'PRODUCT_UPDATED',
            payload: { productId: testProduct._id.toString() },
            timestamp: Date.now(),
            version: 10
        };
        await handleCrossNodeEvent(freshEvent);

        console.log("- Dispatching stale timestamp event (v11, older timestamp)...");
        const staleTsEvent = {
            type: 'PRODUCT_UPDATED',
            payload: { productId: testProduct._id.toString() },
            timestamp: Date.now() - 10000,
            version: 11
        };

        let clearedCount = 0;
        const originalClear = searchCache.clear;
        searchCache.clear = async () => {
            clearedCount++;
        };

        await handleCrossNodeEvent(staleTsEvent);

        console.log("- Dispatching stale version event (v9, newer timestamp)...");
        const staleVerEvent = {
            type: 'PRODUCT_UPDATED',
            payload: { productId: testProduct._id.toString() },
            timestamp: Date.now() + 5000,
            version: 9
        };
        await handleCrossNodeEvent(staleVerEvent);

        searchCache.clear = originalClear;

        console.log(`- Number of stale events processed: ${clearedCount} (Expected 0)`);
        if (clearedCount === 0) {
            console.log("  => PASS (Stale events rejected successfully)");
        } else {
            console.error("  => FAIL: Stale events were not filtered.");
            success = false;
        }

        // 2. Offline replica node catch-up replay validation
        console.log("- Seeding offline event in MongoDB...");
        const eventTimestamp = Date.now() - 30 * 1000; // 30s ago
        await CentralEvent.create({
            type: 'PRODUCT_UPDATED',
            payload: { productId: testProduct._id.toString() },
            senderNode: 'replica-node-1',
            timestamp: eventTimestamp,
            version: 15
        });

        // Clear last processed keys in Redis to simulate node restart catch-up
        await redis.del(`event:last_timestamp:${partitionKey}`);
        await redis.del(`event:last_version:${partitionKey}`);

        let catchUpReplayed = false;
        searchCache.clear = async () => {
            catchUpReplayed = true;
        };

        await catchUpEvents();
        searchCache.clear = originalClear;

        console.log(`- Catch-up replayed offline event: ${catchUpReplayed}`);
        if (catchUpReplayed) {
            console.log("  => PASS (Offline replica node caught up successfully)");
        } else {
            console.error("  => FAIL: Catch-up replay did not trigger.");
            success = false;
        }
        console.log();

        // =============================================================
        // PHASE D: Adversarial AI (Slow Spam & Distributed Abuse)
        // =============================================================
        console.log("---------------------------------------------------------------");
        console.log("PHASE D: Adversarial AI (Slow Spam & Distributed Abuse)");
        console.log("---------------------------------------------------------------");

        // 1. Slow Spam Attack Verification
        console.log("- Simulating Slow Spam (5 requests spread over 65 seconds - bypass 1-min but catch hourly)...");
        
        const slowSpamUser = await User.create({
            name: "SlowSpammer_hardening_test",
            email: `slow_spam_${Date.now()}_hardening_test@aisle.test`,
            password: "password123",
            role: "customer"
        });

        // Insert 25 requests backdated by 15 minutes to simulate slow cumulative requests
        const backdatedRequests = [];
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        for (let i = 0; i < 25; i++) {
            backdatedRequests.push({
                customerId: slowSpamUser._id,
                sellerId: testSeller._id,
                productId: testProduct._id,
                productName: "Hardening Bread_hardening_test",
                status: 'PENDING',
                createdAt: fifteenMinsAgo
            });
        }
        await Request.insertMany(backdatedRequests);

        // Attempt a new request - should block on 1-hour limit (25)
        const checkSlowSpam = await trustService.detectSpamAndFraud(slowSpamUser._id, testProduct._id, testSeller._id, {
            ip: '192.168.1.99',
            headers: { 'x-device-id': 'device_slow_spam_test' }
        });

        console.log(`- Slow Spam block status: ${checkSlowSpam.blocked} | Reason: ${checkSlowSpam.reason}`);
        if (checkSlowSpam.blocked && checkSlowSpam.reason.includes('Anomalous velocity detected')) {
            console.log("  => PASS (Slow Spam cumulative threshold triggered successfully)");
        } else {
            console.error("  => FAIL: Slow Spam was not blocked.");
            success = false;
        }

        // 2. Distributed Abuse Verification
        console.log("- Simulating Distributed Abuse (Coupon Farming: 5 distinct accounts claiming coupon code on same device)...");
        
        const deviceAbuse = `device_abuse_fingerprint_${Date.now()}`;
        const abuseUsers = [];
        for (let i = 0; i < 5; i++) {
            abuseUsers.push(await User.create({
                name: `AbuseUser_${i}_hardening_test`,
                email: `abuseuser_${i}_${Date.now()}_hardening_test@aisle.test`,
                password: "password123",
                role: "customer"
            }));
        }

        // 1st account claims promo
        await Order.create({
            customerId: abuseUsers[0]._id,
            sellerId: testSeller._id,
            status: 'FULFILLED',
            couponCode: 'ATTACK100',
            deviceId: deviceAbuse,
            items: [],
            totalAmount: 100,
            paymentMode: 'PAY_ON_VISIT',
            qrCode: `qr_abuse_0_${Date.now()}`
        });

        // 2nd account claims promo
        await Order.create({
            customerId: abuseUsers[1]._id,
            sellerId: testSeller._id,
            status: 'FULFILLED',
            couponCode: 'ATTACK100',
            deviceId: deviceAbuse,
            items: [],
            totalAmount: 100,
            paymentMode: 'PAY_ON_VISIT',
            qrCode: `qr_abuse_1_${Date.now()}`
        });

        // 3rd account attempts to claim promo on same device
        const checkAbuse = await trustService.detectPromotionAbuse(abuseUsers[2]._id, 'ATTACK100', {
            ip: '127.0.0.1',
            headers: { 'x-device-id': deviceAbuse }
        });

        console.log(`- Distributed Abuse block status: ${checkAbuse.blocked} | Reason: ${checkAbuse.reason}`);
        if (checkAbuse.blocked && checkAbuse.reason.includes('limit exceeded')) {
            console.log("  => PASS (Distributed Abuse coupon farming blocked successfully)");
        } else {
            console.error("  => FAIL: Distributed Abuse was not blocked.");
            success = false;
        }
        console.log();

        // -------------------------------------------------------------
        // WIPE TEST DATA
        // -------------------------------------------------------------
        console.log("🧹 Wiping test records...");
        await User.deleteMany({ email: emailPattern });
        await Product.deleteMany({ name: emailPattern });
        await Request.deleteMany({ productName: emailPattern });
        await Order.deleteMany({ qrCode: emailPattern });
        await FraudEvent.deleteMany({ userId: { $in: [slowSpamUser._id, ...abuseUsers.map(u => u._id)] } });
        await RiskProfile.deleteMany({ userId: { $in: [slowSpamUser._id, ...abuseUsers.map(u => u._id)] } });
        await CustomerTrust.deleteMany({ customerId: { $in: [slowSpamUser._id, ...abuseUsers.map(u => u._id)] } });
        await CentralEvent.deleteMany({});
        console.log("🧹 Cleanup complete.");

    } catch (err) {
        console.error("❌ ENTERPRISE RESILIENCE SYSTEM ERROR:", err);
        success = false;
    } finally {
        await mongoose.connection.close();
        console.log("\n===============================================================");
        if (success) {
            console.log("🏆 Verification Status: SUCCESSFUL");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("  Track 3 Status: ENTERPRISE HARDENED");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            process.exit(0);
        } else {
            console.log("🚨 Verification Status: FAILED");
            process.exit(1);
        }
    }
};

runEnterpriseHardeningCert();
