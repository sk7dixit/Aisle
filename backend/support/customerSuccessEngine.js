const User = require('../models/User');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const SupportTicket = require('../models/SupportTicket');
const CustomerPreferences = require('../models/CustomerPreferences');
const CustomerReminders = require('../models/CustomerReminders');
const CustomerSearchHistory = require('../models/CustomerSearchHistory');
const Product = require('../models/Product');
const SellerHealth = require('./healthScoreEngine'); // If we want to recalculate, or just query SellerHealth model
const SellerHealthModel = require('../models/SellerHealth');

// Helper: Calculate distance (Haversine Formula) - meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1000); // Return in meters
};

/**
 * 1. Seller Health Monitor
 * Tracks response time, delays, cancellation rates, complaints, and rating trend.
 */
const monitorSellerHealth = async (sellerId, userCoords = null) => {
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
        return { score: 100, status: 'UNKNOWN', warnings: [] };
    }

    const ratingsTrend = seller.shopDetails?.rating || 4.5;
    const responseTime = seller.sellerStats?.avgResponseTime || 12; // minutes
    const cancellationRate = seller.sellerStats?.totalRequests > 0 
        ? Math.round(((seller.sellerStats.totalRequests - seller.sellerStats.totalResponses) / seller.sellerStats.totalRequests) * 100)
        : 10; // percentage

    // Fetch complaints related to this seller
    const complaintsCount = await SupportTicket.countDocuments({
        status: 'open',
        summary: { $regex: seller.shopDetails?.shopName || 'seller', $options: 'i' }
    });

    // Determine health classification
    let status = 'HEALTHY';
    let warnings = [];
    if (ratingsTrend < 3.8 || cancellationRate > 25 || complaintsCount > 3) {
        status = 'CRITICAL';
        warnings.push(`Orders from ${seller.shopDetails.shopName} are experiencing severe delays today.`);
    } else if (ratingsTrend < 4.2 || cancellationRate > 15 || responseTime > 30) {
        status = 'WARNING';
        warnings.push(`${seller.shopDetails.shopName} is slower to respond than usual today.`);
    }

    // Get nearby alternatives
    let alternatives = [];
    if (status !== 'HEALTHY' && userCoords) {
        const altSellers = await User.find({
            role: 'seller',
            _id: { $ne: sellerId },
            'shopDetails.shopType': seller.shopDetails?.shopType || 'GROCERY_KIRANA'
        }).limit(3);

        alternatives = altSellers.map(alt => {
            let dist = null;
            if (alt.shopDetails?.shopLocation?.coordinates && userCoords.lat) {
                dist = calculateDistance(
                    userCoords.lat, userCoords.lng,
                    alt.shopDetails.shopLocation.coordinates[1],
                    alt.shopDetails.shopLocation.coordinates[0]
                );
            }
            return {
                _id: alt._id,
                name: alt.shopDetails?.shopName || 'Alternative Store',
                rating: alt.shopDetails?.rating || 4.5,
                distance: dist
            };
        });
    }

    return {
        sellerId,
        shopName: seller.shopDetails?.shopName || 'Unknown Shop',
        score: Math.max(30, 100 - (100 - ratingsTrend * 20) - (cancellationRate / 2) - (complaintsCount * 5)),
        status,
        responseTime,
        cancellationRate,
        complaintsCount,
        warnings,
        alternatives
    };
};

/**
 * 2. Predictive Analytics
 * Predicts customer purchase cycles and calendar events.
 */
const runPredictiveAnalytics = async (customerId) => {
    // Determine purchase cycles
    const pastOrders = await Order.find({ customer: customerId, status: { $in: ['FULFILLED', 'COMPLETED'] } });
    
    let cycles = [];
    if (pastOrders.length > 0) {
        // Simple heuristic: group by products
        const productCounts = {};
        pastOrders.forEach(o => {
            o.items?.forEach(item => {
                if (!productCounts[item.name]) {
                    productCounts[item.name] = [];
                }
                productCounts[item.name].push(new Date(o.createdAt));
            });
        });

        Object.keys(productCounts).forEach(prodName => {
            const dates = productCounts[prodName].sort((a, b) => a - b);
            if (dates.length >= 2) {
                let diffSum = 0;
                for (let i = 1; i < dates.length; i++) {
                    diffSum += (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24); // days
                }
                const avgDays = Math.round(diffSum / (dates.length - 1));
                if (avgDays > 1 && avgDays <= 30) {
                    cycles.push({
                        item: prodName,
                        cycleDays: avgDays,
                        nextDate: new Date(dates[dates.length - 1].getTime() + avgDays * 24 * 60 * 60 * 1000)
                    });
                }
            }
        });
    }

    // Default mock cycles if database history is thin
    if (cycles.length === 0) {
        cycles = [
            { item: "Organic Milk", cycleDays: 3, nextDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
            { item: "Fresh Eggs", cycleDays: 7, nextDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
            { item: "Dog Kibble Food", cycleDays: 30, nextDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }
        ];
    }

    // Upcoming Event predictions (mock events matching customer profile)
    const user = await User.findById(customerId);
    const events = [];
    
    // Check birthday
    events.push({
        id: 'birthday',
        title: '🎂 Birthday Reminder',
        eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Mock 5 days from now
        desc: 'Your saved birthday event is coming up in 5 days. Need gift suggestions?',
        query: 'Need a birthday gift'
    });

    // Upcoming local festival
    events.push({
        id: 'diwali',
        title: '🪔 Diwali Festival Prep',
        eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // Mock 12 days from now
        desc: 'Diwali is approaching. Nearby sellers have added new festive products.',
        query: 'Diwali decorations'
    });

    return {
        purchasePredictions: cycles,
        upcomingEvents: events
    };
};

/**
 * 3. Proactive Alert Engine
 * Collects price drops, back-in-stock, new sellers, and delays.
 */
const getProactiveAlerts = async (customerId, userCoords = null) => {
    const alerts = [];

    // Check for order delays
    const activeOrders = await Order.find({
        customer: customerId,
        status: { $nin: ['CANCELLED', 'FULFILLED', 'COMPLETED', 'DELIVERED'] }
    });

    let hasDelayedOrder = false;
    for (let order of activeOrders) {
        const diffMinutes = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
        if (diffMinutes > 15) { // 15 mins criteria for delay flag
            hasDelayedOrder = true;
            alerts.push({
                type: 'ORDER_DELAY',
                title: '⚠ Delivery Delay Detected',
                message: `Your order from ${order.shopName || 'Merchant'} is running ${diffMinutes + 10} minutes behind schedule. Seller has been notified.`,
                orderId: order._id,
                actionLabel: 'Track Updates',
                query: `track order ${order._id}`
            });
        }
    }

    // Fallback order delay if none in database to show in UI
    if (!hasDelayedOrder) {
        alerts.push({
            type: 'ORDER_DELAY',
            title: '⚠ Delivery Delay Detected',
            message: 'Your order from Fresh Mart is running 45 minutes behind schedule. Seller has been notified.',
            actionLabel: 'Track Updates',
            query: 'Track my order'
        });
    }

    // Price Drop Alerts (Ensure at least 3 exist)
    const products = await Product.find({ isAvailable: true, adminStatus: 'Active' }).limit(10);
    const dbPriceDrops = products.filter(p => p.sellingPrice < (p.price || p.sellingPrice + 100));
    
    dbPriceDrops.forEach(p => {
        const dropAmount = (p.price || p.sellingPrice + 100) - p.sellingPrice;
        if (dropAmount > 0) {
            alerts.push({
                type: 'PRICE_DROP',
                title: '💰 Price Drop Alert',
                message: `Your saved product "${p.name}" price dropped ₹${dropAmount}.`,
                productId: p._id,
                actionLabel: 'Buy Now',
                query: `🛍 Shopping Help`
            });
        }
    });

    // Fallback price drops to ensure exactly 3 are populated if DB is dry
    if (alerts.filter(a => a.type === 'PRICE_DROP').length < 3) {
        const fallbacks = [
            { title: '💰 Price Drop: Tata Salt', message: 'Tata Salt (1kg) dropped from ₹30 to ₹25.', query: 'Need milk' },
            { title: '💰 Price Drop: Fortune Oil', message: 'Fortune Mustard Oil (1L) dropped from ₹200 to ₹175.', query: '🛍 Shopping Help' },
            { title: '💰 Price Drop: ASUS TUF Laptop', message: 'ASUS TUF Gaming Laptop dropped by ₹4,000.', query: 'help me buy a laptop' }
        ];
        fallbacks.forEach(f => {
            if (alerts.filter(a => a.type === 'PRICE_DROP').length < 3) {
                alerts.push({
                    type: 'PRICE_DROP',
                    title: f.title,
                    message: f.message,
                    actionLabel: 'Check Deal',
                    query: f.query
                });
            }
        });
    }

    // Trending Nearby Alert
    alerts.push({
        type: 'TRENDING_NEARBY',
        title: '🔥 Trending Nearby',
        message: 'Homemade Cakes and Smart Watches are trending in your area this week.',
        actionLabel: 'See Trends',
        query: 'Find bakery near me'
    });

    // New Seller Alert
    if (userCoords) {
        const newSellers = await User.find({
            role: 'seller',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Registered in last 30 days
        }).limit(2);

        newSellers.forEach(s => {
            alerts.push({
                type: 'NEW_SELLER',
                title: '🏪 New Seller Alert',
                message: `A new ${s.shopDetails?.shopCategory || 'Bakery'} opened near your location: ${s.shopDetails?.shopName || 'Baker Delight'}.`,
                sellerId: s._id,
                actionLabel: 'View Shop',
                query: `Find bakery near me`
            });
        });
    } else {
        // Fallback new seller
        alerts.push({
            type: 'NEW_SELLER',
            title: '🏪 New Seller Alert',
            message: 'A new bakery opened near your location: Priya\'s Bakehouse.',
            actionLabel: 'View Shop',
            query: 'Find bakery near me'
        });
    }

    // Diwali event
    alerts.push({
        type: 'EVENT',
        title: '🪔 Diwali Festival Prep',
        message: 'Diwali is approaching! Explore local decorations, diyas, and sweet boxes from nearby vendors.',
        actionLabel: 'Festive Shop',
        query: 'Diwali decorations'
    });

    // Birthday event
    alerts.push({
        type: 'EVENT',
        title: '🎂 Birthday Reminder',
        message: 'Your saved birthday event is coming up in 5 days. Need gift suggestions?',
        actionLabel: 'Get Ideas',
        query: 'Need a birthday gift'
    });

    return alerts;
};

/**
 * 4. Fraud Detection
 * Flags under-review status if seller statistics reflect issues.
 */
const detectFraudStatus = async (sellerId) => {
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') return { status: 'UNKNOWN' };

    const rating = seller.shopDetails?.rating || 4.5;
    const cancellationRate = seller.sellerStats?.totalRequests > 0 
        ? Math.round(((seller.sellerStats.totalRequests - seller.sellerStats.totalResponses) / seller.sellerStats.totalRequests) * 100)
        : 10;
    
    // Fetch unresolved disputes count
    const disputesCount = await SupportTicket.countDocuments({
        status: 'open',
        priority: 'urgent',
        summary: { $regex: seller.shopDetails?.shopName || 'seller', $options: 'i' }
    });

    let ratingAlert = rating < 3.6;
    let cancellationAlert = cancellationRate > 35;
    let disputeAlert = disputesCount > 3;

    if (ratingAlert || cancellationAlert || disputeAlert) {
        return {
            sellerId,
            shopName: seller.shopDetails?.shopName || 'Merchant',
            status: 'UNDER_REVIEW',
            warning: 'This seller is currently under review. We recommend waiting for verification.',
            reasons: { ratingAlert, cancellationAlert, disputeAlert }
        };
    }

    return {
        sellerId,
        shopName: seller.shopDetails?.shopName || 'Merchant',
        status: 'VERIFIED'
    };
};

/**
 * 5. Customer Success Score
 * Evaluates dynamic score and assigns gold/silver status.
 */
const calculateCustomerHealth = async (customerId) => {
    const user = await User.findById(customerId);
    if (!user) return { score: 100, status: 'REGULAR' };

    const totalOrders = await Order.countDocuments({ customer: customerId });
    const fulfilledOrders = await Order.countDocuments({ customer: customerId, status: { $in: ['FULFILLED', 'COMPLETED', 'DELIVERED'] } });
    const cancelledOrders = await Order.countDocuments({ customer: customerId, status: 'CANCELLED' });

    // Dispute count
    const disputesCount = await SupportTicket.countDocuments({
        userId: customerId,
        summary: { $regex: 'dispute|charge|refund', $options: 'i' }
    });

    let successRate = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 100;
    
    // Customer Success Score math
    let score = 100;
    score -= cancelledOrders * 5;
    score -= disputesCount * 8;
    score = Math.max(50, Math.min(100, score));

    // VIP Tier
    let vipTier = 'REGULAR';
    if (totalOrders >= 15 || (totalOrders >= 5 && score >= 90)) {
        vipTier = 'GOLD';
    } else if (totalOrders >= 5) {
        vipTier = 'SILVER';
    }

    return {
        customerId,
        userName: user.name,
        score,
        successRate,
        totalOrders,
        cancelledOrders,
        disputesCount,
        vipTier
    };
};

module.exports = {
    monitorSellerHealth,
    runPredictiveAnalytics,
    getProactiveAlerts,
    detectFraudStatus,
    calculateCustomerHealth
};
