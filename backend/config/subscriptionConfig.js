// Core Subscription Plan Definitions
const SUBSCRIPTION_PLANS = {
    FREE: {
        planId: 'free',
        name: 'Free Premium',
        productLimit: 120,
        visibilityPriority: 1,
        accessTopProductsInsight: false,
        priceMonthly: 0
    },
    GROWTH: {
        planId: 'growth',
        name: 'Growth Plan',
        productLimit: 300,
        visibilityPriority: 2,
        accessTopProductsInsight: false,
        priceMonthly: 50
    },
    PRO: {
        planId: 'pro',
        name: 'Pro Plan',
        productLimit: Infinity, // Use Infinity for unlimited
        visibilityPriority: 3,
        accessTopProductsInsight: true,
        priceMonthly: 99
    }
};

const VISIBILITY_BOOST = {
    DAILY: {
        type: 'daily',
        durationHours: 24,
        price: 15,
        visibilityScoreBonus: 0.5 // Boost score (never exceeds Pro's base priority gap)
    },
    WEEKLY: {
        type: 'weekly',
        durationHours: 24 * 7,
        price: 80,
        visibilityScoreBonus: 0.5
    }
};

module.exports = {
    SUBSCRIPTION_PLANS,
    VISIBILITY_BOOST
};
