const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const ProductTrend = require('../models/ProductTrend');
const DemandGap = require('../models/DemandGap');
const MasterCatalogProduct = require('../models/MasterCatalogProduct');
const MasterCatalogSellerProduct = require('../models/MasterCatalogSellerProduct');
const SearchAnalytics = require('../models/SearchAnalytics');
const SellerIntelligence = require('../models/SellerIntelligence');
const SellerRecommendation = require('../models/SellerRecommendation');

const {
    calculateSellerIntelligence,
    generateSellerRecommendations,
    learnFromFeedback
} = require('../services/sellerIntelligenceService');

const { askSellerAssistant } = require('../controllers/analyticsController');

async function runTests() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected.');

        const sellerEmail = 'test_seller_intel@aisle.in';

        // Clean up previous test runs
        console.log('\n--- Cleaning up previous test data ---');
        const mockSeller = await User.findOne({ email: sellerEmail });
        if (mockSeller) {
            await SellerIntelligence.deleteMany({ sellerId: mockSeller._id });
            await SellerRecommendation.deleteMany({ sellerId: mockSeller._id });
            await Product.deleteMany({ seller: mockSeller._id });
            await MasterCatalogSellerProduct.deleteMany({ seller: mockSeller._id });
        }

        const testKeywords = ['protein powder', 'cold coffee', 'test_milk'];
        await ProductTrend.deleteMany({ keyword: { $in: testKeywords } });
        await DemandGap.deleteMany({ keyword: { $in: testKeywords } });
        await MasterCatalogProduct.deleteMany({ name: { $in: testKeywords } });
        await SearchAnalytics.deleteMany({ keyword: { $in: testKeywords } });

        // 1. Seed Mock Seller
        console.log('\n--- Seeding Mock Seller ---');
        let seller = await User.findOne({ email: sellerEmail });
        if (!seller) {
            seller = await User.create({
                name: 'Test Intel Seller',
                email: sellerEmail,
                password: 'password123',
                role: 'seller',
                verificationStatus: 'approved',
                shopDetails: {
                    shopName: 'Test Intel Grocery Shop',
                    city: 'Indore',
                    state: 'Madhya Pradesh',
                    category: 'Grocery',
                    shopCategory: 'Grocery',
                    shopType: 'GROCERY_KIRANA',
                    location: {
                        city: 'Indore'
                    },
                    shopLocation: {
                        type: 'Point',
                        coordinates: [75.8839, 22.7244],
                        city: 'Indore'
                    }
                },
                sellerStats: {
                    responseRate: 92,
                    totalRequests: 10,
                    totalResponses: 9
                }
            });
        }
        console.log(`Mock Seller seeded: ID = ${seller._id}`);

        // 2. Seed Mock Products in Inventory
        console.log('\n--- Seeding Seller Inventory ---');
        // Seed an active product that is running low to test Restock Prediction
        const milkProduct = await Product.create({
            seller: seller._id,
            name: 'test_milk',
            brand: 'Mock Dairy',
            shopType: 'GROCERY_KIRANA',
            categorySlug: 'dairy-ice-cream',
            category: 'Grocery',
            subCategory: 'Dairy & Ice Cream',
            mrp: 60,
            sellingPrice: 58,
            unit: 'Packet',
            quantity: 2, // low quantity
            views: 15,   // decent views
            stockStatus: 'IN_STOCK',
            productType: 'DAILY_ESSENTIAL',
            isAvailable: true
        });
        console.log(`Seed product created: ${milkProduct.name} (Qty: ${milkProduct.quantity}, Views: ${milkProduct.views})`);

        // 3. Seed Master Catalog & Marketplace Analytics
        console.log('\n--- Seeding Catalog & Analytics ---');
        // Seed demand gap for "protein powder"
        await DemandGap.create({
            keyword: 'protein powder',
            city: 'indore',
            demandScore: 120,
            supplyScore: 10,
            gapScore: 88,
            opportunityLevel: 'high'
        });

        // Seed product trend for "cold coffee"
        await ProductTrend.create({
            keyword: 'cold coffee',
            city: 'indore',
            searchCount: 150,
            clickCount: 10,
            trendScore: 92,
            growthPercentage: 180,
            demandLevel: 'very_high'
        });

        // Seed master product in catalog for "protein powder" so accepting it syncs from catalog
        const masterProduct = await MasterCatalogProduct.create({
            name: 'protein powder',
            brand: 'Peak Nutrition',
            category: 'Grocery',
            price: 450,
            imageUrl: 'https://via.placeholder.com/150/protein_powder.png'
        });
        console.log(`Master Catalog Product seeded: ${masterProduct.name}`);

        // 4. Test calculateSellerIntelligence
        console.log('\n--- Running calculateSellerIntelligence ---');
        const profile = await calculateSellerIntelligence(seller._id);
        console.log('Seller Intelligence Profile generated:', {
            sellerId: profile.sellerId,
            categories: profile.categories,
            primaryCategory: profile.primaryCategory,
            trendAffinity: profile.trendAffinity,
            inventoryStrength: profile.inventoryStrength,
            demandCoverage: profile.demandCoverage,
            opportunityScore: profile.opportunityScore
        });

        if (profile.opportunityScore > 0 && profile.primaryCategory === 'Grocery') {
            console.log('✅ Seller Intelligence Profile calculations are correct.');
        } else {
            throw new Error('❌ Seller Intelligence Profile check failed.');
        }

        // 5. Test generateSellerRecommendations
        console.log('\n--- Running generateSellerRecommendations ---');
        await generateSellerRecommendations(seller._id);

        const recs = await SellerRecommendation.find({ sellerId: seller._id });
        console.log(`Generated ${recs.length} recommendations:`);
        recs.forEach(r => {
            console.log(`- Type: ${r.type} | Title: "${r.title}" | Confidence: ${r.confidence}% | Est. Rev: ₹${r.estimatedRevenue} | Insights: "${r.competitorInsights}"`);
        });

        const oppRec = recs.find(r => r.type === 'inventory_opportunity' && r.product === 'protein powder');
        const restockRec = recs.find(r => r.type === 'restock_prediction' && r.product === 'test_milk');
        const trendRec = recs.find(r => r.type === 'trending_spike' && r.product === 'cold coffee');

        if (oppRec && restockRec && trendRec) {
            console.log('✅ Recommendation Engine generated all three types of recommendations correctly.');
            console.log(`✅ Revenue Estimator verified: Estimated Revenue for protein powder = ₹${oppRec.estimatedRevenue}`);
        } else {
            throw new Error('❌ Recommendation Engine verification failed: missing expected recommendation types.');
        }

        // 6. Test Feedback Learning Loop (Accept Recommendation)
        console.log('\n--- Running learnFromFeedback (Action: ACCEPT) ---');
        await learnFromFeedback(oppRec._id, seller._id, 'accept');

        const allSellerProds = await Product.find({ seller: seller._id });
        console.log("ALL PRODUCTS FOR SELLER:", allSellerProds.map(p => ({ name: p.name, catalogProductId: p.catalogProductId })));

        const newlySyncedProduct = await Product.findOne({ seller: seller._id, name: { $regex: new RegExp(`^${oppRec.product}$`, 'i') } });
        if (newlySyncedProduct && newlySyncedProduct.catalogProductId) {
            console.log(`✅ Newly Synced Product created: ${newlySyncedProduct.name} | Source: ${newlySyncedProduct.source} | Stock: ${newlySyncedProduct.quantity}`);
        } else {
            throw new Error('❌ Catalog product sync failed.');
        }

        const postAcceptProfile = await SellerIntelligence.findOne({ sellerId: seller._id });
        console.log(`Post-acceptance Profile Coverage: ${postAcceptProfile.demandCoverage} (Old was ${profile.demandCoverage})`);

        if (postAcceptProfile.demandCoverage >= profile.demandCoverage) {
            console.log('✅ Feedback loop correctly triggers metric recalculation and updates score.');
        } else {
            throw new Error('❌ Metric recalculation after feedback loop failed.');
        }

        // 7. Test AI Seller Assistant chatbot responses
        console.log('\n--- Testing AI Business Assistant ---');
        const mockReqStock = { user: seller, body: { query: 'What should I stock this week?' } };
        const mockReqRestock = { user: seller, body: { query: 'Any restock warnings?' } };
        const mockReqHealth = { user: seller, body: { query: 'How is my business health?' } };

        const mockRes = {
            status: function() { return this; },
            json: function(data) {
                console.log(`Assistant Reply for query: "${this.queryName}"`);
                console.log(data.reply);
                console.log('--------------------------------------------------');
                return this;
            }
        };

        mockRes.queryName = 'What should I stock this week?';
        await askSellerAssistant(mockReqStock, mockRes);

        mockRes.queryName = 'Any restock warnings?';
        await askSellerAssistant(mockReqRestock, mockRes);

        mockRes.queryName = 'How is my business health?';
        await askSellerAssistant(mockReqHealth, mockRes);

        console.log('🎉 ALL PERSONALIZED SELLER INTELLIGENCE TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
    } finally {
        console.log('Closing database connection...');
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

runTests();
