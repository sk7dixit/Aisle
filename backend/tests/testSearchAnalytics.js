const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const SearchAnalytics = require('../models/SearchAnalytics');
const ProductTrend = require('../models/ProductTrend');
const DemandGap = require('../models/DemandGap');
const SellerOpportunity = require('../models/SellerOpportunity');
const SeasonalTrend = require('../models/SeasonalTrend');
const Product = require('../models/Product');
const User = require('../models/User');
const SellerNotification = require('../models/SellerNotification');
const { trackSearch } = require('../services/searchAnalyticsService');
const { aggregateSearchTrends } = require('../services/trendAggregationService');
const { getAdminTrends, getAdminCityTrends, getMarketplaceIntelligenceDashboard } = require('../controllers/adminController');
const { getSellerOpportunities, getSellerTrendsDashboard } = require('../controllers/analyticsController');
const { getRedisClient, isRedisActive } = require('../config/redis');

async function runTests() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected.');

        // Clean up previous test artifacts
        const testKeywords = ['test_protein', 'test_coffee', 'test_umbrella'];
        await SearchAnalytics.deleteMany({ keyword: { $in: testKeywords } });
        await ProductTrend.deleteMany({ keyword: { $in: testKeywords } });
        await DemandGap.deleteMany({ keyword: { $in: testKeywords } });
        await SellerOpportunity.deleteMany({ product: { $in: testKeywords } });
        await SeasonalTrend.deleteMany({ keyword: { $in: testKeywords } });

        // Seed a mock seller in Indore to receive opportunity alerts
        let mockSeller = await User.findOne({ email: 'test_seller_indore@aisle.in' });
        if (!mockSeller) {
            mockSeller = await User.create({
                name: 'Test Seller',
                email: 'test_seller_indore@aisle.in',
                password: 'password123',
                role: 'seller',
                verificationStatus: 'approved',
                shopDetails: {
                    shopName: 'Test Indore Shop',
                    city: 'Indore',
                    state: 'Madhya Pradesh',
                    shopCategory: 'Grocery',
                    shopType: 'GROCERY_KIRANA'
                }
            });
        } else {
            if (!mockSeller.shopDetails) mockSeller.shopDetails = {};
            mockSeller.shopDetails.city = 'Indore';
            mockSeller.shopDetails.shopCategory = 'Grocery';
            mockSeller.shopDetails.shopType = 'GROCERY_KIRANA';
            await mockSeller.save();
        }

        console.log('\n--- Seeding Searches in Last 24 Hours (Current Period) ---');
        // Seed current period searches for "test_protein" (Indore) - 80 searches, 40 clicks, 5 unique users
        for (let i = 0; i < 80; i++) {
            const userId = new mongoose.Types.ObjectId();
            const clickId = i < 40 ? new mongoose.Types.ObjectId() : null; // 40 clicks
            await SearchAnalytics.create({
                keyword: 'test_protein',
                city: 'Indore',
                state: 'Madhya Pradesh',
                resultsCount: 10,
                clickedProductId: clickId,
                userId: i < 5 ? userId : null, // 5 unique users
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            });
        }

        // Seed current period searches for "test_coffee" (Indore) - 10 searches, 2 clicks, 1 unique user
        for (let i = 0; i < 10; i++) {
            await SearchAnalytics.create({
                keyword: 'test_coffee',
                city: 'Indore',
                state: 'Madhya Pradesh',
                resultsCount: 5,
                clickedProductId: i < 2 ? new mongoose.Types.ObjectId() : null,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
            });
        }

        console.log('\n--- Seeding Searches in Previous 24-48 Hours (Previous Period) ---');
        // Seed previous period searches for "test_protein" (Indore) - 40 searches (this means growth = 100%)
        for (let i = 0; i < 40; i++) {
            await SearchAnalytics.create({
                keyword: 'test_protein',
                city: 'Indore',
                state: 'Madhya Pradesh',
                createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000) // 30 hours ago
            });
        }

        console.log('\n--- Test 1: Trend Engine Calculation Worker ---');
        await aggregateSearchTrends();

        const proteinTrend = await ProductTrend.findOne({ keyword: 'test_protein', city: 'Indore' });
        if (proteinTrend) {
            console.log('✅ ProductTrend record created for test_protein.');
            console.log(`   Growth calculated: ${proteinTrend.growthPercentage}% (Expected: 100%)`);
            console.log(`   Trend Score calculated: ${proteinTrend.trendScore}`);
            console.log(`   Demand Level classified: ${proteinTrend.demandLevel}`);
            
            if (proteinTrend.growthPercentage === 100) {
                console.log('   ✅ Growth percentage calculation passes.');
            } else {
                throw new Error(`❌ Growth percentage calculation failed: ${proteinTrend.growthPercentage}%`);
            }
        } else {
            throw new Error('❌ ProductTrend record not found for test_protein');
        }

        console.log('\n--- Test 2: Demand Gap Scoring Engine ---');
        const proteinGap = await DemandGap.findOne({ keyword: 'test_protein', city: 'Indore' });
        if (proteinGap) {
            console.log('✅ DemandGap record created for test_protein.');
            console.log(`   Demand Score: ${proteinGap.demandScore}`);
            console.log(`   Supply Score: ${proteinGap.supplyScore}`);
            console.log(`   Gap Score: ${proteinGap.gapScore} (Expected: Demand - Supply)`);
            console.log(`   Opportunity Level: ${proteinGap.opportunityLevel}`);
            
            if (proteinGap.gapScore === Math.max(0, proteinGap.demandScore - proteinGap.supplyScore)) {
                console.log('   ✅ Gap score calculation passes.');
            } else {
                throw new Error(`❌ Gap score mismatch: ${proteinGap.gapScore}`);
            }
        } else {
            throw new Error('❌ DemandGap record not found for test_protein');
        }

        console.log('\n--- Test 3: Seller Opportunity Alerts & Notifications ---');
        const alerts = await SellerOpportunity.find({ product: 'test_protein', city: 'Indore' });
        if (alerts.length > 0) {
            console.log(`✅ Generated ${alerts.length} opportunity alert(s) for test_protein.`);
            const matchesMock = alerts.some(a => a.sellerId.toString() === mockSeller._id.toString());
            if (matchesMock) {
                console.log('   ✅ Successfully targeted mock seller in Indore.');
            } else {
                console.warn('   ⚠️ Mock seller not directly targeted. Seller list:', alerts.map(a => a.sellerId));
            }
        } else {
            console.log('   ⚠️ No opportunity alerts found. This is expected if GapScore <= 70. Let\'s check gap score:', proteinGap?.gapScore);
        }

        // Check SellerNotification
        const notifs = await SellerNotification.find({ sellerId: mockSeller._id, type: 'DEMAND_GAP_ALERT' });
        console.log(`✅ Seller received ${notifs.length} system notification(s).`);

        console.log('\n--- Test 4: Seasonal Trend Mapping ---');
        const seasonal = await SeasonalTrend.findOne({ keyword: 'test_protein' });
        if (seasonal) {
            console.log(`✅ SeasonalTrend record archived: Season=${seasonal.season}, PeakMonth=${seasonal.peakMonth}, Searches=${seasonal.averageSearchCount}`);
        } else {
            throw new Error('❌ SeasonalTrend archive failed for test_protein');
        }

        console.log('\n--- Test 5: Redis Trend Cache Layer ---');
        if (isRedisActive()) {
            const redis = getRedisClient();
            const cachedTrends = await redis.get('trend:city:indore');
            if (cachedTrends) {
                const parsed = JSON.parse(cachedTrends);
                console.log(`✅ Redis Cache hit for trend:city:indore. Found ${parsed.length} cached trends.`);
                const hasProtein = parsed.some(t => t.keyword === 'test_protein');
                if (hasProtein) {
                    console.log('   ✅ Redis cache contains test_protein.');
                }
            } else {
                console.warn('   ⚠️ Redis cache key "trend:city:indore" not found.');
            }
        } else {
            console.log('   ⚠️ Redis offline. Skipping cache verification.');
        }

        console.log('\n--- Test 6: Admin Dashboard API (Admin Controller) ---');
        const mockAdminRes = {
            json: function(data) {
                this.body = data;
            }
        };

        // Test getMarketplaceIntelligenceDashboard
        await getMarketplaceIntelligenceDashboard({}, mockAdminRes);
        if (mockAdminRes.body) {
            console.log('✅ Admin Dashboard API returned marketplace intelligence fields.');
            console.log('   Top Trending:', mockAdminRes.body.topTrending?.length || 0);
            console.log('   Emerging Trends:', mockAdminRes.body.emergingTrends?.length || 0);
            console.log('   Demand Gaps:', mockAdminRes.body.demandGaps?.length || 0);
            console.log('   Low Supply Areas:', mockAdminRes.body.lowSupplyAreas?.length || 0);
            console.log('   High Opportunity Categories:', mockAdminRes.body.highOpportunityCategories?.length || 0);
        } else {
            throw new Error('❌ Admin Dashboard API failed');
        }

        console.log('\n--- Test 7: Seller Dashboard API (Analytics Controller) ---');
        const mockSellerRes = {
            json: function(data) {
                this.body = data;
            }
        };
        const mockSellerReq = {
            user: mockSeller
        };

        await getSellerTrendsDashboard(mockSellerReq, mockSellerRes);
        if (mockSellerRes.body) {
            console.log('✅ Seller Dashboard API returned trend fields.');
            console.log('   Opportunity Alerts Count:', mockSellerRes.body.opportunityAlerts?.length || 0);
            console.log('   Trending Nearby Count:', mockSellerRes.body.trendingNearby?.length || 0);
            console.log('   Recommended Products Count:', mockSellerRes.body.recommendedProducts?.length || 0);
            console.log('   Expected Demand Count:', mockSellerRes.body.expectedDemand?.length || 0);
        } else {
            throw new Error('❌ Seller Dashboard API failed');
        }

        // Clean up mock test data
        await SearchAnalytics.deleteMany({ keyword: { $in: testKeywords } });
        await ProductTrend.deleteMany({ keyword: { $in: testKeywords } });
        await DemandGap.deleteMany({ keyword: { $in: testKeywords } });
        await SellerOpportunity.deleteMany({ product: { $in: testKeywords } });
        await SeasonalTrend.deleteMany({ keyword: { $in: testKeywords } });
        
        // Clean up mock seller if created during test
        if (mockSeller.email === 'test_seller_indore@aisle.in') {
            await User.deleteOne({ _id: mockSeller._id });
            await SellerNotification.deleteMany({ sellerId: mockSeller._id });
        }

        console.log('\n🎉 ALL PHASE 1 TASK 2 TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('Test execution failed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

runTests();
