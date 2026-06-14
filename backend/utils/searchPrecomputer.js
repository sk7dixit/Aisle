const Product = require('../models/Product');
const User = require('../models/User');
const Request = require('../models/Request');
const { getRedisClient, isRedisActive } = require('../config/redis');

const precomputeSearchData = async () => {
    try {
        console.log('[SearchPrecomputer] Starting search data precomputation...');
        
        if (!isRedisActive()) {
            console.log('[SearchPrecomputer] Redis is offline. Skipping precomputation.');
            return;
        }
        
        const redis = getRedisClient();

        // 1. Precompute Trending Products
        const trendingProducts = await Product.find({ isAvailable: { $ne: false }, isDraft: { $ne: true } })
            .sort({ views: -1 })
            .limit(20)
            .populate('seller', 'shopDetails subscription');

        const trendingPayload = trendingProducts.map(p => ({
            _id: p._id,
            name: p.name,
            imageUrl: p.imageUrl,
            price: p.sellingPrice || p.price || 0,
            shopName: p.seller?.shopDetails?.shopName || 'Unknown Shop',
            views: p.views || 0
        }));

        await redis.set('precomputed:trending_products', JSON.stringify(trendingPayload), 'EX', 1800); // 30 mins TTL
        console.log(`[SearchPrecomputer] Precomputed ${trendingPayload.length} trending products.`);

        // 2. Precompute Top Shops
        const topShops = await User.find({ role: 'seller', verificationStatus: 'approved' })
            .select('shopDetails subscription')
            .limit(20);

        const shopsPayload = topShops.map(s => ({
            _id: s._id,
            name: s.shopDetails?.shopName,
            category: s.shopDetails?.shopCategory,
            rating: s.shopDetails?.rating || 0,
            isOpen: s.shopDetails?.isOpen || false
        })).sort((a, b) => b.rating - a.rating);

        await redis.set('precomputed:top_shops', JSON.stringify(shopsPayload), 'EX', 1800);
        console.log(`[SearchPrecomputer] Precomputed ${shopsPayload.length} top shops.`);

        // 3. Precompute Most Requested Products
        const mostRequested = await Request.aggregate([
            { $match: { status: { $in: ['PENDING', 'AUTO_ACCEPTED', 'COMPLETED'] } } },
            { $group: { _id: '$productName', count: { $sum: 1 }, image: { $first: '$productImage' } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        const requestPayload = mostRequested.map(r => ({
            name: r._id,
            requestCount: r.count,
            image: r.image
        }));

        await redis.set('precomputed:most_requested', JSON.stringify(requestPayload), 'EX', 1800);
        console.log(`[SearchPrecomputer] Precomputed ${requestPayload.length} most requested products.`);

        console.log('[SearchPrecomputer] Search data precomputation successfully complete.');
    } catch (error) {
        console.error('[SearchPrecomputer] Error during search precomputation:', error.message);
    }
};

module.exports = { precomputeSearchData };
