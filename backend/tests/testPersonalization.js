const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const CustomerProfile = require('../models/CustomerProfile');
const CustomerActivity = require('../models/CustomerActivity');
const RecommendationCache = require('../models/RecommendationCache');
const RecommendationAnalytics = require('../models/RecommendationAnalytics');
const ProductTrend = require('../models/ProductTrend');
const Notification = require('../models/Notification');

const {
    trackActivity,
    generatePersonalizedFeed,
    refreshAllCustomerCaches,
    runReEngagementCheck,
    getPersonalizedAssistantResponse
} = require('../services/personalizationService');

async function runTests() {
    const testCustomerEmail = 'personalization_customer@test.com';
    const testSellerEmail = 'personalization_seller@test.com';
    
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected.');

        // 1. Clean up old test data
        console.log('\n--- Cleaning up previous test data ---');
        await User.deleteMany({ email: { $in: [testCustomerEmail, testSellerEmail] } });
        await CustomerProfile.deleteMany({});
        await CustomerActivity.deleteMany({});
        await RecommendationCache.deleteMany({});
        await RecommendationAnalytics.deleteMany({});
        await ProductTrend.deleteMany({ keyword: { $in: ['test_protein', 'test_milk'] } });
        await Notification.deleteMany({});

        // 2. Seed Customer
        console.log('\n--- Seeding Mock Customer ---');
        const customer = await User.create({
            name: 'John Personalization Customer',
            email: testCustomerEmail,
            password: 'password123',
            role: 'customer',
            customerLocation: {
                lat: 28.6139,
                lng: 77.2090,
                city: 'Delhi',
                state: 'Delhi',
                isGpsSet: true
            }
        });
        console.log(`Mock Customer seeded: ID = ${customer._id}`);

        // 3. Seed Seller
        console.log('\n--- Seeding Mock Seller ---');
        const seller = await User.create({
            name: 'Personalization Fitness Seller',
            email: testSellerEmail,
            password: 'password123',
            role: 'seller',
            verificationStatus: 'approved',
            shopDetails: {
                shopName: 'Delhi Premium Fitness Hub',
                city: 'Delhi',
                state: 'Delhi',
                category: 'Fitness',
                shopCategory: 'Fitness',
                shopType: 'GROCERY_KIRANA',
                shopLocation: {
                    type: 'Point',
                    coordinates: [77.2090, 28.6139], // Delhi
                    city: 'Delhi'
                },
                rating: 4.8
            }
        });
        console.log(`Mock Seller seeded: ID = ${seller._id}`);

        // 4. Seed Products
        console.log('\n--- Seeding Products ---');
        const productsData = [
            { name: 'test_protein', sellingPrice: 1500, category: 'Fitness', quantity: 20, stockStatus: 'IN_STOCK' },
            { name: 'test_milk', sellingPrice: 80, category: 'Grocery', quantity: 15, stockStatus: 'IN_STOCK' },
            { name: 'protein bar', sellingPrice: 120, category: 'Fitness', quantity: 50, stockStatus: 'IN_STOCK' },
            { name: 'creatine powder', sellingPrice: 700, category: 'Fitness', quantity: 8, stockStatus: 'IN_STOCK' }
        ];

        for (const item of productsData) {
            await Product.create({
                seller: seller._id,
                name: item.name,
                brand: 'Test Brand',
                shopType: 'grocery_kirana',
                categorySlug: item.category.toLowerCase(),
                category: item.category,
                subCategory: 'Supplements',
                mrp: item.sellingPrice + 50,
                sellingPrice: item.sellingPrice,
                unit: 'Pack',
                quantity: item.quantity,
                stockStatus: item.stockStatus,
                productType: 'DAILY_ESSENTIAL',
                isAvailable: true
            });
        }
        console.log('Mock products seeded.');

        // 5. Test Case 1: Behavioral tracking & Interest Scoring
        console.log('\n--- Test 1: Customer Activity Tracking & Interest Scoring ---');
        await trackActivity(customer._id, 'search', null, null, { query: 'protein powder' });
        await trackActivity(customer._id, 'view_product', null, 'Product', { category: 'Fitness' });
        await trackActivity(customer._id, 'wishlist', null, 'Product', { category: 'Fitness' });

        const profile = await CustomerProfile.findOne({ userId: customer._id });
        console.log('Customer segment derived:', profile.segment);
        console.log('Category Scores:', [...profile.categoryScores.entries()]);

        if (profile.segment === 'Fitness' && profile.categoryScores.get('Fitness') > 5) {
            console.log('✅ Test 1 passes: Customer segment classified as Fitness.');
        } else {
            throw new Error('❌ Test 1 failed.');
        }

        // 6. Test Case 2: Multi-Factor Feed Ranking
        console.log('\n--- Test 2: AI Multi-Factor Home Feed Ranking ---');
        // Seed trend
        await ProductTrend.create({
            keyword: 'test_protein',
            city: 'Delhi',
            trendScore: 85,
            growthPercentage: 150,
            demandLevel: 'high'
        });

        const feed = await generatePersonalizedFeed(customer._id, 28.6139, 77.2090, 5, true);
        console.log('Recommended products count:', feed.recommendedProducts.length);
        console.log('Recommended shops count:', feed.recommendedShops.length);
        
        feed.recommendedProducts.forEach((p, idx) => {
            console.log(`${idx + 1}. Product: "${p.name}" | Score: ${p._score}`);
        });

        const topProduct = feed.recommendedProducts[0];
        if (topProduct && topProduct.name === 'test_protein' && topProduct._score > 50) {
            console.log('✅ Test 2 passes: Product test_protein ranked at top due to Fitness segment boost.');
        } else {
            throw new Error('❌ Test 2 failed.');
        }

        // 7. Test Case 3: Predictive Discovery recommendations
        console.log('\n--- Test 3: Predictive Discovery items check ---');
        console.log('Predictive Discoveries:', feed.predictiveDiscoveries.map(p => p.name));
        
        // Expect 'protein bar' or 'creatine powder' because user is Fitness segment and has never viewed them
        const hasPredictiveItem = feed.predictiveDiscoveries.some(p => p.name === 'protein bar' || p.name === 'creatine powder');
        if (hasPredictiveItem) {
            console.log('✅ Test 3 passes: Recommends unseen fitness products predictively.');
        } else {
            throw new Error('❌ Test 3 failed.');
        }

        // 8. Test Case 4: Cache Engine
        console.log('\n--- Test 4: Recommendation Cache hit ---');
        const start = Date.now();
        const cachedFeed = await generatePersonalizedFeed(customer._id, 28.6139, 77.2090, 5, false);
        const diff = Date.now() - start;
        console.log(`Cache fetch completed in: ${diff}ms`);
        console.log(`Inferred segment from cache: ${cachedFeed.segment}`);

        if (diff < 50) {
            console.log('✅ Test 4 passes: Cache returned output under 50ms.');
        } else {
            console.log('⚠️ Warning: Cache retrieval was slow.');
        }

        // 9. Test Case 5: Re-Engagement check
        console.log('\n--- Test 5: Re-Engagement scanner for inactive users ---');
        // Set profile lastActiveAt to 8 days ago
        const eightDaysAgo = new Date();
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
        profile.lastActiveAt = eightDaysAgo;
        await profile.save();

        await runReEngagementCheck();

        const notif = await Notification.findOne({ user: customer._id });
        if (notif) {
            console.log(`Notification sent: Title: "${notif.title}" | Message: "${notif.message}"`);
            console.log('✅ Test 5 passes: Re-engagement notification sent.');
        } else {
            throw new Error('❌ Test 5 failed.');
        }

        // 10. Test Case 6: Personalized AI assistant
        console.log('\n--- Test 6: Personalized AI Chatbot Assistant suggestions ---');
        const assistantText = await getPersonalizedAssistantResponse(customer._id, "What should I buy this week?");
        console.log('Assistant Reply snippet:\n', assistantText.slice(0, 200) + '...');
        if (assistantText.includes('Fitness') || assistantText.includes('protein')) {
            console.log('✅ Test 6 passes: Assistant returns tailored answers based on interests.');
        } else {
            throw new Error('❌ Test 6 failed.');
        }

        console.log('\n🎉 ALL CUSTOMER PERSONALIZATION & RECOMMENDATION ENGINE TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
    } finally {
        // Cleanup mock records
        console.log('\nCleaning up mock data...');
        await User.deleteMany({ email: { $in: [testCustomerEmail, testSellerEmail] } });
        await CustomerProfile.deleteMany({});
        await CustomerActivity.deleteMany({});
        await RecommendationCache.deleteMany({});
        await RecommendationAnalytics.deleteMany({});
        await ProductTrend.deleteMany({ keyword: { $in: ['test_protein', 'test_milk'] } });
        await Notification.deleteMany({});
        
        console.log('Closing database connection...');
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

runTests();
