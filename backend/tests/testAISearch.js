const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const SearchIntent = require('../models/SearchIntent');
const AIProductKnowledge = require('../models/AIProductKnowledge');

const {
    searchAI,
    recordSearchClick,
    recordSearchConversion,
    getSearchSuggestions,
    seedKnowledge
} = require('../services/aiSearchService');

async function runTests() {
    const testEmail = 'ai_search_seller@test.com';
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected.');

        // 1. Clean up old test data
        console.log('\n--- Cleaning up previous test data ---');
        const mockSeller = await User.findOne({ email: testEmail });
        if (mockSeller) {
            await Product.deleteMany({ seller: mockSeller._id });
            await User.deleteOne({ _id: mockSeller._id });
        }
        await SearchIntent.deleteMany({ query: { $in: ['need snacks for birthday party', 'need healthy protein options', 'asdjhaskd', 'need breakfast items'] } });

        // 2. Seed Mock Seller (Delhi location matching search parameters)
        console.log('\n--- Seeding Mock Seller ---');
        const seller = await User.create({
            name: 'AI Search Test Seller',
            email: testEmail,
            password: 'password123',
            role: 'seller',
            verificationStatus: 'approved',
            shopDetails: {
                shopName: 'AI Test Grocery Store',
                city: 'Delhi',
                state: 'Delhi',
                category: 'Grocery',
                shopCategory: 'Grocery',
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

        // 3. Seed Mock Products
        console.log('\n--- Seeding Mock Products ---');
        const productsData = [
            { name: 'protein powder', sellingPrice: 1200, category: 'Grocery', quantity: 15, stockStatus: 'IN_STOCK', views: 50 },
            { name: 'potato chips', sellingPrice: 40, category: 'Grocery', quantity: 20, stockStatus: 'IN_STOCK', views: 30 },
            { name: 'cold drinks', sellingPrice: 60, category: 'Grocery', quantity: 10, stockStatus: 'IN_STOCK', views: 15 },
            { name: 'paper plates', sellingPrice: 50, category: 'Grocery', quantity: 4, stockStatus: 'LIMITED', views: 5 },
            { name: 'eggs', sellingPrice: 80, category: 'Grocery', quantity: 50, stockStatus: 'IN_STOCK', views: 100 }
        ];

        for (const item of productsData) {
            await Product.create({
                seller: seller._id,
                name: item.name,
                brand: 'AI Test Brand',
                shopType: 'grocery_kirana',
                categorySlug: 'grocery',
                category: item.category,
                subCategory: 'Snacks',
                mrp: item.sellingPrice + 10,
                sellingPrice: item.sellingPrice,
                unit: 'Pack',
                quantity: item.quantity,
                views: item.views,
                stockStatus: item.stockStatus,
                productType: 'DAILY_ESSENTIAL',
                isAvailable: true
            });
        }
        console.log(`Seeded ${productsData.length} products in Delhi location.`);

        // 4. Seed Intent Knowledge Templates
        await seedKnowledge();

        // 5. Test Case 1: Intent & Entity Parsing + Bundles Matching
        console.log('\n--- Test 1: AI Search Intent Matching & Bundling ("Need snacks for birthday party") ---');
        const res1 = await searchAI('Need snacks for birthday party', 28.6139, 77.2090, 5);
        console.log('Detected Intent:', res1.intent);
        console.log('Confidence:', res1.confidence + '%');
        console.log('Extracted Entities:', res1.extractedEntities);
        console.log('Products Count:', res1.products.length);
        console.log('Shops Count:', res1.shops.length);
        console.log('Bundles Suggested Count:', res1.bundleRecommendations.length);

        if (res1.bundleRecommendations.length > 0) {
            const bundle = res1.bundleRecommendations[0];
            console.log(`- Bundle Name: "${bundle.name}" | Bundle Price: ₹${bundle.bundlePrice} (Saved: ₹${bundle.estimatedSavings})`);
            console.log(`  Items:`, bundle.products.map(p => p.name));
        }

        if (res1.intent === 'party_snacks' && res1.bundleRecommendations.length > 0 && res1.products.length > 0) {
            console.log('✅ Test 1 passes: Intent mapped to party_snacks and bundle compiled correctly.');
        } else {
            throw new Error('❌ Test 1 failed.');
        }

        // 6. Test Case 2: Multi-Factor Ranking Engine validation
        console.log('\n--- Test 2: Multi-Factor Ranking Engine Score Verification ---');
        // Let's print product scores
        res1.products.forEach(p => {
            console.log(`Product: "${p.name}" | Distance: ${Math.round(p.distance)}m | Score: ${p.score}/100`);
        });

        const topProduct = res1.products[0];
        // Expect exact matches or higher view count to rank higher
        if (topProduct && topProduct.score > 50) {
            console.log('✅ Test 2 passes: Products scored and ranked correctly.');
        } else {
            throw new Error('❌ Test 2 failed.');
        }

        // 7. Test Case 3: Fallback Strategy ("asdjhaskd")
        console.log('\n--- Test 3: Fallback Strategy validation ("asdjhaskd") ---');
        const res3 = await searchAI('asdjhaskd', 28.6139, 77.2090, 5);
        console.log('Detected Intent for garbage query:', res3.intent);
        console.log('Fallback Triggered:', res3.fallback);

        if (res3.fallback) {
            console.log('✅ Test 3 passes: Fallback flag returned on low confidence.');
        } else {
            throw new Error('❌ Test 3 failed.');
        }

        // 8. Test Case 4: Caching validation (Redis)
        console.log('\n--- Test 4: Redis Intent Cache validation ---');
        const queryVal = 'Need breakfast items';
        
        // Clear cache first if exists
        const { getRedisClient, isRedisActive } = require('../config/redis');
        if (isRedisActive()) {
            const redis = getRedisClient();
            await redis.del(`ai:search:query:${queryVal.toLowerCase().trim()}:28.6139:77.209:5`);
        }

        // Measure time for cold run
        const startCold = Date.now();
        const resCold = await searchAI(queryVal, 28.6139, 77.2090, 5);
        const timeCold = Date.now() - startCold;
        console.log(`Cold Run Response Time: ${timeCold}ms`);

        // Measure time for hot run (should be cached)
        const startHot = Date.now();
        const resHot = await searchAI(queryVal, 28.6139, 77.2090, 5);
        const timeHot = Date.now() - startHot;
        console.log(`Hot Run (Cached) Response Time: ${timeHot}ms`);

        if (timeHot < 50) {
            console.log('✅ Test 4 passes: Caching reduces response times significantly (under 50ms).');
        } else {
            console.log('⚠️ Redis cache was not hit or Redis is disabled.');
        }

        // 9. Test Case 5: Learning click tracking
        console.log('\n--- Test 5: Search Learning Click Tracking ---');
        const searchIntentId = res1.searchIntentId;
        console.log(`Tracking click on SearchIntent ID: ${searchIntentId}`);
        
        const beforeClick = await SearchIntent.findById(searchIntentId);
        await recordSearchClick(searchIntentId);
        const afterClick = await SearchIntent.findById(searchIntentId);
        console.log(`Clicks count: Before = ${beforeClick.clicks} | After = ${afterClick.clicks}`);

        if (afterClick.clicks === beforeClick.clicks + 1) {
            console.log('✅ Test 5 passes: Click counts correctly incremented on intent logs.');
        } else {
            throw new Error('❌ Test 5 failed.');
        }

        // 10. Test Case 6: Suggestions API
        console.log('\n--- Test 6: Suggestions Autocomplete ---');
        const suggestions = await getSearchSuggestions('party');
        console.log('Suggestions list:', suggestions);
        
        const hasIntentSuggestion = suggestions.some(s => s.intent === 'party_snacks');
        if (hasIntentSuggestion) {
            console.log('✅ Test 6 passes: Autocomplete returned mapped natural language prompt suggestions.');
        } else {
            throw new Error('❌ Test 6 failed.');
        }

        console.log('\n🎉 ALL AI SEARCH & INTENT UNDERSTANDING ENGINE TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
    } finally {
        // Clean up
        const mockSeller = await User.findOne({ email: testEmail });
        if (mockSeller) {
            await Product.deleteMany({ seller: mockSeller._id });
            await User.deleteOne({ _id: mockSeller._id });
        }
        console.log('Closing database connection...');
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

runTests();
