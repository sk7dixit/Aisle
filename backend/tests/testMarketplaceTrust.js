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
const Review = require('../models/Review');
const SellerTrust = require('../models/SellerTrust');
const CustomerTrust = require('../models/CustomerTrust');
const RiskProfile = require('../models/RiskProfile');
const FraudEvent = require('../models/FraudEvent');
const AIProductKnowledge = require('../models/AIProductKnowledge');

// Services
const trustService = require('../services/trustService');
const aiSearchService = require('../services/aiSearchService');

const runTests = async () => {
    let testSeller1 = null;
    let testSeller2 = null;
    let testCustomer1 = null;
    let testCustomer2 = null;
    let testProduct1 = null;
    let testProduct2 = null;

    try {
        await connectDB();
        console.log("Connected to MongoDB.");

        // Clear existing test knowledge to avoid collision and ensure it exists
        await AIProductKnowledge.deleteMany({ intent: 'breakfast' });
        await AIProductKnowledge.create({
            intent: 'breakfast',
            category: 'Grocery',
            products: ['milk', 'bread'],
            bundleName: 'Breakfast Bundle',
            bundleProducts: ['milk', 'bread']
        });

        // ----------------------------------------------------
        // TEST 1: Trust Score Calculation (Seller & Customer)
        // ----------------------------------------------------
        console.log("\n--- TEST 1: Trust Score Calculation ---");

        // Create high trust seller (approved, active)
        testSeller1 = await User.create({
            name: "High Trust Seller",
            email: `seller_high_${Date.now()}@aisle.test`,
            password: "password123",
            role: "seller",
            verificationStatus: "approved",
            accountStatus: "active",
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days old
            shopDetails: {
                shopName: "High Trust Groceries",
                category: "Grocery",
                upiId: `upi_high_${Date.now()}@okaxis`,
                rating: 4.8
            },
            sellerStats: {
                avgResponseTime: 4, // super fast
                totalDisputes: 0
            }
        });

        // Create low trust seller (needs review, high response time, disputes)
        testSeller2 = await User.create({
            name: "Low Trust Seller",
            email: `seller_low_${Date.now()}@aisle.test`,
            password: "password123",
            role: "seller",
            verificationStatus: "needs_review",
            accountStatus: "active",
            createdAt: new Date(), // brand new
            shopDetails: {
                shopName: "Low Trust Corner",
                category: "Grocery",
                upiId: `upi_low_${Date.now()}@okaxis`,
                rating: 2.5
            },
            sellerStats: {
                avgResponseTime: 95, // very slow
                totalDisputes: 4
            }
        });

        // Calculate seller trust
        const sellerTrust1 = await trustService.calculateSellerTrust(testSeller1._id);
        const sellerTrust2 = await trustService.calculateSellerTrust(testSeller2._id);

        console.log(`[Seller 1] Name: ${testSeller1.name} | Calculated Trust Score: ${sellerTrust1.trustScore}/100`);
        console.log(`[Seller 2] Name: ${testSeller2.name} | Calculated Trust Score: ${sellerTrust2.trustScore}/100`);

        if (sellerTrust1.trustScore <= sellerTrust2.trustScore) {
            throw new Error("Assert Failed: High trust seller must have higher trust score than low trust seller.");
        }
        console.log("✅ Trust calculation comparison passed!");

        // Customer Trust Score Calculation
        testCustomer1 = await User.create({
            name: "Spammy Customer",
            email: `cust_spam_${Date.now()}@aisle.test`,
            password: "password123",
            role: "customer"
        });

        // Create order cancellations and mock fraud events
        await Order.create({
            customerId: testCustomer1._id,
            sellerId: testSeller1._id,
            status: "CANCELLED",
            items: [],
            totalAmount: 100,
            paymentMode: "PAY_ON_VISIT",
            qrCode: `qr_cancel_${Date.now()}`
        });

        await FraudEvent.create({
            userId: testCustomer1._id,
            eventType: "spam_requests",
            severity: "high",
            status: "pending_moderation",
            details: { reason: "Triggered rate limit check" }
        });

        const custTrust1 = await trustService.calculateCustomerTrust(testCustomer1._id);
        console.log(`[Customer 1] Calculated Trust Score: ${custTrust1.trustScore}/100 (Cancellations: ${custTrust1.cancellationsCount}, Spam: ${custTrust1.spamRequestsCount})`);

        if (custTrust1.trustScore >= 100) {
            throw new Error("Assert Failed: Customer trust score should be reduced due to cancellations and spam alerts.");
        }
        console.log("✅ Customer trust score penalty calculation passed!");


        // ----------------------------------------------------
        // TEST 2: Risk Profile Calculation
        // ----------------------------------------------------
        console.log("\n--- TEST 2: Risk Profile Evaluation ---");
        const risk1 = await RiskProfile.findOne({ userId: testSeller1._id });
        const risk2 = await RiskProfile.findOne({ userId: testSeller2._id });

        console.log(`[Seller 1 Risk] Score: ${risk1.riskScore}, Level: ${risk1.riskLevel}`);
        console.log(`[Seller 2 Risk] Score: ${risk2.riskScore}, Level: ${risk2.riskLevel}, Reasons: ${JSON.stringify(risk2.reasons)}`);

        if (risk1.riskScore >= risk2.riskScore) {
            throw new Error("Assert Failed: Low-trust seller must have a higher risk score than high-trust seller.");
        }
        console.log("✅ Risk Profile validation passed!");


        // ----------------------------------------------------
        // TEST 3: Duplicate Seller Detection
        // ----------------------------------------------------
        console.log("\n--- TEST 3: Duplicate Seller Detection ---");
        // Create a duplicate seller sharing seller 2's UPI
        const testSellerDup = await User.create({
            name: "Duplicate UPI Seller",
            email: `seller_dup_${Date.now()}@aisle.test`,
            password: "password123",
            role: "seller",
            verificationStatus: "pending",
            shopDetails: {
                shopName: "Dup Shop",
                category: "Grocery",
                upiId: testSeller2.shopDetails.upiId // Shared UPI
            }
        });

        const duplicates = await trustService.detectDuplicateSellers(testSellerDup._id);
        console.log(`[Duplicate Check] Matches found: ${duplicates.length}. Details: ${duplicates.map(d => d.email).join(', ')}`);

        const fraudAlert = await FraudEvent.findOne({ userId: testSellerDup._id, eventType: "duplicate_seller" });
        if (!fraudAlert) {
            throw new Error("Assert Failed: Fraud event was not generated for duplicate UPI registration.");
        }
        console.log("✅ Duplicate credential registration correctly caught and logged!");
        await User.deleteOne({ _id: testSellerDup._id });
        await FraudEvent.deleteOne({ _id: fraudAlert._id });


        // ----------------------------------------------------
        // TEST 4: Spam Request Velocity Check
        // ----------------------------------------------------
        console.log("\n--- TEST 4: Spam Request Velocity Check ---");
        testCustomer2 = await User.create({
            name: "Normal Customer",
            email: `cust_norm_${Date.now()}@aisle.test`,
            password: "password123",
            role: "customer"
        });

        const mockReq = {
            ip: "127.0.0.1",
            headers: { 'x-device-id': 'dev_test_device_spam' }
        };

        // Create a product for request references
        testProduct1 = await Product.create({
            seller: testSeller1._id,
            name: "Premium Fresh Bread",
            category: "Grocery",
            subCategory: "Bakery",
            categorySlug: "bakery",
            shopType: "GROCERY_KIRANA",
            productType: "DAILY_ESSENTIAL",
            countInStock: 20,
            sellingPrice: 40,
            adminStatus: "Active",
            isAvailable: true
        });

        // Send 6 rapid requests in last minute
        for (let i = 0; i < 6; i++) {
            await Request.create({
                customerId: testCustomer2._id,
                sellerId: testSeller1._id,
                status: "PENDING",
                productId: testProduct1._id,
                productName: testProduct1.name
            });
        }

        const spamCheck = await trustService.detectSpamAndFraud(testCustomer2._id, null, testSeller1._id, mockReq);
        console.log(`[Spam Check] Blocked status: ${spamCheck.blocked}, Reason: "${spamCheck.reason}"`);

        if (!spamCheck.blocked) {
            throw new Error("Assert Failed: Velocity block did not trigger after exceeding request thresholds.");
        }
        console.log("✅ Velocity block triggered and requests throttled successfully!");


        // ----------------------------------------------------
        // TEST 5: Review Integrity Engine
        // ----------------------------------------------------
        console.log("\n--- TEST 5: Review Integrity Check ---");
        // A. Self-Review Block
        const selfReview = await trustService.validateReviewIntegrity(testSeller1._id, testSeller1._id, 5, "Best store ever!", mockReq);
        console.log(`[Self Review Check] Blocked status: ${selfReview.isFraud}, Reason: "${selfReview.reason}"`);
        if (!selfReview.isFraud) {
            throw new Error("Assert Failed: Self-review was not blocked.");
        }

        // B. Co-located Device Review Block
        // Store visualAssets deviceId on Seller 1
        await User.findByIdAndUpdate(testSeller1._id, {
            'shopDetails.visualAssets': [{ deviceId: 'dev_seller_colocated_123', assetType: 'storefront' }]
        });

        const sameDeviceReq = {
            ip: "192.168.1.100",
            headers: { 'x-device-id': 'dev_seller_colocated_123' }
        };

        const colocatedReview = await trustService.validateReviewIntegrity(testCustomer1._id, testSeller1._id, 5, "Great products!", sameDeviceReq);
        console.log(`[Co-located Device Check] Blocked status: ${colocatedReview.isFraud}, Reason: "${colocatedReview.reason}"`);
        if (!colocatedReview.isFraud) {
            throw new Error("Assert Failed: Co-located device review check was not caught.");
        }
        console.log("✅ Review integrity rules verified successfully!");


        // ----------------------------------------------------
        // TEST 6: Promotion / Coupon Abuse
        // ----------------------------------------------------
        console.log("\n--- TEST 6: Promotion / Coupon Abuse Check ---");
        const couponReq = {
            ip: "10.0.0.5",
            headers: { 'x-device-id': 'device_coupon_farming' }
        };

        // Create orders from another customer using the same coupon code and device ID
        const otherCustomer = await User.create({
            name: "Other Customer",
            email: `cust_other_${Date.now()}@aisle.test`,
            password: "password123",
            role: "customer"
        });

        await Order.create({
            customerId: otherCustomer._id,
            sellerId: testSeller1._id,
            status: "FULFILLED",
            couponCode: "WELCOME50",
            deviceId: "device_coupon_farming",
            items: [],
            totalAmount: 150,
            paymentMode: "PAY_ON_VISIT",
            qrCode: `qr_promo1_${Date.now()}_${Math.random()}`
        });

        await Order.create({
            customerId: testCustomer1._id,
            sellerId: testSeller1._id,
            status: "FULFILLED",
            couponCode: "WELCOME50",
            deviceId: "device_coupon_farming",
            items: [],
            totalAmount: 150,
            paymentMode: "PAY_ON_VISIT",
            qrCode: `qr_promo2_${Date.now()}_${Math.random()}`
        });

        const promoAbuse = await trustService.detectPromotionAbuse(testCustomer2._id, "WELCOME50", couponReq);
        console.log(`[Promo Abuse Check] Blocked status: ${promoAbuse.blocked}, Reason: "${promoAbuse.reason}"`);
        if (!promoAbuse.blocked) {
            throw new Error("Assert Failed: Coupon farming detection did not trigger.");
        }
        console.log("✅ Promotion coupon farming limits verified!");
        await User.deleteOne({ _id: otherCustomer._id });


        // ----------------------------------------------------
        // TEST 7: AI Moderation Copilot
        // ----------------------------------------------------
        console.log("\n--- TEST 7: AI Moderation Copilot Output ---");
        const forensicReport = await trustService.getModerationCopilotDecision(testCustomer1._id);
        console.log("Compiled Audit:\n" + forensicReport);
        if (!forensicReport.includes("AI Moderation Forensic Summary")) {
            throw new Error("Assert Failed: Copilot compiled reasoning is missing standard forensic headers.");
        }
        console.log("✅ AI Moderation Copilot forensic compiling checked!");


        // ----------------------------------------------------
        // TEST 8: Trust-Based Search Ranking weight
        // ----------------------------------------------------
        console.log("\n--- TEST 8: Trust-Based Search Ranking ---");
        
        // Approve Low Trust Seller so they are visible to search, but keep low rating/stats for lower trust score
        await User.findByIdAndUpdate(testSeller2._id, { verificationStatus: 'approved' });
        await trustService.calculateSellerTrust(testSeller2._id);

        // Create same product for low-trust seller (high-trust is already created as testProduct1)
        testProduct2 = await Product.create({
            seller: testSeller2._id,
            name: "Discount Stale Bread",
            category: "Grocery",
            subCategory: "Bakery",
            categorySlug: "bakery",
            shopType: "GROCERY_KIRANA",
            productType: "DAILY_ESSENTIAL",
            countInStock: 20,
            sellingPrice: 40,
            adminStatus: "Active",
            isAvailable: true
        });

        // Clear Redis cache for the query to prevent cache hits from previous runs
        try {
            const { getRedisClient, isRedisActive } = require('../config/redis');
            if (isRedisActive()) {
                const redis = getRedisClient();
                await redis.del('ai:search:query:breakfast:null:null:5');
                console.log("Deleted Redis cache key for 'breakfast' search query.");
            }
        } catch (redisErr) {
            console.log("Could not clear Redis cache:", redisErr.message);
        }

        // Execute searchAI for term 'breakfast' (matches Intent 'breakfast' -> products: 'milk', 'bread')
        // We pass no coordinates so that distance score is identical (10 points each)
        // High-trust seller should rank first due to higher trust score component (15% weighting)
        const searchResults = await aiSearchService.searchAI('breakfast', null, null);

        console.log("Search Results order:");
        searchResults.products.forEach((p, idx) => {
            console.log(`[Rank ${idx + 1}] Product: "${p.name}" | Shop: "${p.shopName}" | Total Score: ${p.score || 'N/A'}`);
        });

        const indexHigh = searchResults.products.findIndex(p => p._id.toString() === testProduct1._id.toString());
        const indexLow = searchResults.products.findIndex(p => p._id.toString() === testProduct2._id.toString());
        
        if (indexHigh === -1 || indexLow === -1) {
            throw new Error(`Assert Failed: Could not find both test products in results. High index: ${indexHigh}, Low index: ${indexLow}`);
        }
        
        console.log(`[Rank Check] High-Trust Product Rank Index: ${indexHigh}, Low-Trust Product Rank Index: ${indexLow}`);
        if (indexHigh >= indexLow) {
            throw new Error(`Assert Failed: Product from High Trust Seller (rank index: ${indexHigh}) did not rank higher than Low Trust Seller (rank index: ${indexLow}).`);
        }
        console.log("✅ Trust-based search ranking successfully sorted high-trust products to the top!");


        // Cleanup Database
        await User.deleteMany({ _id: { $in: [testSeller1._id, testSeller2._id, testCustomer1._id, testCustomer2._id] } });
        await Product.deleteMany({ seller: { $in: [testSeller1._id, testSeller2._id] } });
        await Request.deleteMany({ customerId: { $in: [testCustomer1._id, testCustomer2._id] } });
        await Order.deleteMany({ customerId: { $in: [testCustomer1._id, testCustomer2._id] } });
        await SellerTrust.deleteMany({ sellerId: { $in: [testSeller1._id, testSeller2._id] } });
        await CustomerTrust.deleteMany({ customerId: { $in: [testCustomer1._id, testCustomer2._id] } });
        await RiskProfile.deleteMany({ userId: { $in: [testSeller1._id, testSeller2._id, testCustomer1._id, testCustomer2._id] } });
        await FraudEvent.deleteMany({ userId: { $in: [testSeller1._id, testSeller2._id, testCustomer1._id, testCustomer2._id] } });

        console.log("\n==============================================");
        console.log("🎉 ALL INTEGRATION TESTS PASSED CLEANLY!");
        console.log("==============================================");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ TEST SUITE FAILURE:", err);
        // Clean up on failure
        if (testSeller1) await User.deleteOne({ _id: testSeller1._id });
        if (testSeller2) await User.deleteOne({ _id: testSeller2._id });
        if (testCustomer1) await User.deleteOne({ _id: testCustomer1._id });
        if (testCustomer2) await User.deleteOne({ _id: testCustomer2._id });
        if (testProduct1) await Product.deleteOne({ _id: testProduct1._id });
        if (testProduct2) await Product.deleteOne({ _id: testProduct2._id });
        process.exit(1);
    }
};

runTests();
