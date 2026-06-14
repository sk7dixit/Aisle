const mongoose = require('mongoose');
const SearchAnalytics = require('../models/SearchAnalytics');
const ProductTrend = require('../models/ProductTrend');
const DemandGap = require('../models/DemandGap');
const SellerOpportunity = require('../models/SellerOpportunity');
const SeasonalTrend = require('../models/SeasonalTrend');
const Product = require('../models/Product');
const User = require('../models/User');
const SellerNotification = require('../models/SellerNotification');
const { getRedisClient, isRedisActive } = require('../config/redis');

// Helper to determine season by month (1-12)
const getSeasonForMonth = (month) => {
    if (month >= 3 && month <= 6) return 'summer';
    if (month >= 7 && month <= 9) return 'monsoon';
    return 'winter'; // October to February
};

async function aggregateSearchTrends() {
    try {
        console.log('[TrendAggregationService] Starting Product Trend Engine and Demand Gap aggregation...');

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // 1. Current Period Aggregation (Last 24 Hours)
        const currentAgg = await SearchAnalytics.aggregate([
            {
                $match: {
                    createdAt: { $gte: oneDayAgo }
                }
            },
            {
                $group: {
                    _id: {
                        keyword: "$normalizedKeyword",
                        city: "$city"
                    },
                    searchCount: { $sum: 1 },
                    clickCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$clickedProductId", null] },
                                        { $ne: ["$clickedProductId", undefined] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    userIds: { $addToSet: "$userId" },
                    categories: { $addToSet: "$category" }
                }
            }
        ]);

        if (currentAgg.length === 0) {
            console.log('[TrendAggregationService] No search logs found in the last 24 hours. Skipping calculations.');
            return;
        }

        // 2. Previous Period Aggregation (Previous 24 Hours)
        const previousAgg = await SearchAnalytics.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: twoDaysAgo,
                        $lt: oneDayAgo
                    }
                }
            },
            {
                $group: {
                    _id: {
                        keyword: "$normalizedKeyword",
                        city: "$city"
                    },
                    searchCount: { $sum: 1 }
                }
            }
        ]);

        // Map previous counts for rapid lookup
        const previousMap = new Map();
        previousAgg.forEach(item => {
            const key = `${item._id.keyword}_${item._id.city || 'global'}`;
            previousMap.set(key, item.searchCount);
        });

        // 3. Process each trend keyword-city combo
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        for (const item of currentAgg) {
            const keyword = item._id.keyword || 'unknown';
            const city = item._id.city || 'global';
            const searchCount = item.searchCount;
            const clickCount = item.clickCount;
            const uniqueUsersCount = item.userIds.filter(Boolean).length || 1; // Fallback to 1 if all are guest/null
            const category = item.categories.filter(Boolean)[0] || 'General';

            const prevKey = `${keyword}_${city}`;
            const previousCount = previousMap.get(prevKey) || 0;

            // Step 2: Growth % Formula
            // Growth % = ((Current - Previous) / Previous) * 100
            // If Previous is 0, growth is current * 100
            let growthPercentage = 0;
            if (previousCount > 0) {
                growthPercentage = ((searchCount - previousCount) / previousCount) * 100;
            } else {
                growthPercentage = searchCount * 100;
            }

            // Step 3: Demand Scoring Engine
            // Weights: Searches 40%, Clicks 30%, Growth 20%, Users 10%
            const searchesScore = Math.min(100, (searchCount / 100) * 100); // 100+ searches = max score
            const clickScore = searchCount > 0 ? Math.min(100, (clickCount / searchCount) * 100) : 0;
            const growthScore = Math.min(100, Math.max(0, growthPercentage));
            const usersScore = Math.min(100, (uniqueUsersCount / 10) * 100); // 10+ unique users = max score

            const trendScore = Math.round(
                (searchesScore * 0.4) +
                (clickScore * 0.3) +
                (growthScore * 0.2) +
                (usersScore * 0.1)
            );

            // Demand Levels
            let demandLevel = 'low';
            if (trendScore >= 76) demandLevel = 'very_high';
            else if (trendScore >= 51) demandLevel = 'high';
            else if (trendScore >= 26) demandLevel = 'medium';

            // Save ProductTrend
            await ProductTrend.findOneAndUpdate(
                { keyword, city, createdAt: { $gte: todayStart } },
                {
                    $set: {
                        searchCount,
                        clickCount,
                        uniqueUsers: uniqueUsersCount,
                        trendScore,
                        growthPercentage,
                        demandLevel
                    }
                },
                { upsert: true, new: true }
            );

            // Step 4: Supply Scoring Engine
            // Count matching active products in the local city
            const localSellers = await User.find({
                role: 'seller',
                'shopDetails.city': city
            }).select('_id');
            const localSellerIds = localSellers.map(s => s._id);

            const supplyCount = await Product.countDocuments({
                seller: { $in: localSellerIds },
                quantity: { $gt: 0 },
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { brand: { $regex: keyword, $options: 'i' } },
                    { category: { $regex: keyword, $options: 'i' } }
                ]
            });

            // Map supplyCount to a 0-100 score
            let supplyScore = 0;
            if (supplyCount === 0) supplyScore = 0;
            else if (supplyCount <= 2) supplyScore = 10;
            else if (supplyCount <= 5) supplyScore = 20;
            else if (supplyCount <= 20) supplyScore = 50;
            else supplyScore = 100;

            // Step 5: Demand Gap Score
            // GapScore = DemandScore - SupplyScore
            const gapScore = Math.max(0, trendScore - supplyScore);

            let opportunityLevel = 'low';
            if (gapScore >= 76) opportunityLevel = 'very_high';
            else if (gapScore >= 51) opportunityLevel = 'high';
            else if (gapScore >= 26) opportunityLevel = 'medium';

            // Step 6: Create DemandGap Record
            await DemandGap.findOneAndUpdate(
                { keyword, city },
                {
                    $set: {
                        demandScore: trendScore,
                        supplyScore,
                        gapScore,
                        opportunityLevel
                    }
                },
                { upsert: true, new: true }
            );

            // Step 12: Opportunity Automation (GapScore >= 80 triggers automatic high-priority SellerOpportunity creation)
            if (gapScore > 70 || gapScore >= 80) {
                // Find sellers in this city
                const sellers = await User.find({
                    role: 'seller',
                    'shopDetails.city': city
                });

                for (const seller of sellers) {
                    const sellerCategory = seller.shopDetails?.shopCategory || seller.shopDetails?.shopType || '';
                    
                    // Simple keyword-category match heuristic
                    // Or match if keyword is classified in seller's domain
                    const isGroceryMatch = (sellerCategory.toLowerCase().includes('grocery') || sellerCategory.toLowerCase().includes('kirana'));
                    const isMedicalMatch = sellerCategory.toLowerCase().includes('pharmacy') || sellerCategory.toLowerCase().includes('medical');
                    
                    const isRelevant = !sellerCategory || 
                                     (keyword.toLowerCase().includes('milk') && isGroceryMatch) ||
                                     (keyword.toLowerCase().includes('bread') && isGroceryMatch) ||
                                     (keyword.toLowerCase().includes('protein') && isGroceryMatch) ||
                                     (keyword.toLowerCase().includes('medicine') && isMedicalMatch) ||
                                     (keyword.toLowerCase().includes('pill') && isMedicalMatch) ||
                                     (isGroceryMatch && category.toLowerCase().includes('grocery')) ||
                                     (isMedicalMatch && category.toLowerCase().includes('surgical'));

                    if (isRelevant) {
                        // Avoid duplicates created in the same day
                        const existingOpp = await SellerOpportunity.findOne({
                            sellerId: seller._id,
                            product: keyword,
                            createdAt: { $gte: todayStart }
                        });

                        if (!existingOpp) {
                            await SellerOpportunity.create({
                                sellerId: seller._id,
                                title: "High Demand Opportunity",
                                product: keyword,
                                city: city,
                                gapScore,
                                opportunityLevel,
                                estimatedDemand: `${searchCount} searches`
                            });

                            // Auto Notification (Step 13)
                            await SellerNotification.create({
                                sellerId: seller._id,
                                source: 'SYSTEM',
                                type: 'DEMAND_GAP_ALERT',
                                priority: 'IMPORTANT',
                                title: 'High Demand Opportunity Detected',
                                message: `High demand for ${keyword} detected in your area (${searchCount} searches). Consider stocking this item.`
                            }).catch(e => console.error('[Notification Dispatch] Failed to send Seller Notification:', e.message));
                        }
                    }
                }
            }

            // Step 11: Seasonal Trend Engine
            const currentMonth = now.getMonth() + 1; // 1-12
            const currentYear = now.getFullYear();
            const currentSeason = getSeasonForMonth(currentMonth);

            await SeasonalTrend.findOneAndUpdate(
                { season: currentSeason, keyword, year: currentYear },
                {
                    $set: {
                        peakMonth: currentMonth
                    },
                    $inc: {
                        averageSearchCount: searchCount
                    }
                },
                { upsert: true, new: true }
            );
        }

        // Step 14: Redis Trend Cache Layer
        if (isRedisActive()) {
            const redis = getRedisClient();
            
            // Resolve all distinct cities with active trends
            const cities = await ProductTrend.distinct('city');
            cities.push('global');

            for (const city of cities) {
                const cityTrends = await ProductTrend.find({ city })
                    .sort({ trendScore: -1 })
                    .limit(100);

                const cacheKey = `trend:city:${city.toLowerCase()}`;
                await redis.set(cacheKey, JSON.stringify(cityTrends), 'EX', 900); // 15 mins TTL
            }
            
            // Also cache top gaps
            const topGaps = await DemandGap.find()
                .sort({ gapScore: -1 })
                .limit(100);
            await redis.set('trend:gaps:top', JSON.stringify(topGaps), 'EX', 900);

            console.log('[TrendAggregationService] Redis Trend Cache updated successfully.');
        }

        console.log('[TrendAggregationService] Aggregation and gap calculations completed successfully.');
    } catch (err) {
        console.error('[TrendAggregationService] Critical failure in trend calculation:', err);
    }
}

module.exports = {
    aggregateSearchTrends
};
