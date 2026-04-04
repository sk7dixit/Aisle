// Helper: AI Confidence Score Logic
const calculateSellerConfidence = (seller) => {
    let score = 0;
    const stats = seller.sellerStats || { avgResponseTime: 60, responseRate: 80 }; // Defaults

    // 1. Shop Open Status (+30)
    if (seller.shopDetails?.isOpen) score += 30;

    // 2. Fast Response Time < 30m (+25)
    if (stats.avgResponseTime !== null && stats.avgResponseTime < 30) score += 25;
    else if (stats.avgResponseTime !== null && stats.avgResponseTime < 90) score += 15;

    // 3. Response Rate (+20 or +10)
    // If we have actual tracking data, use it. Otherwise fallback to default.
    let rate = 0.8; // Default
    if (stats.totalRequests > 0) {
        rate = stats.totalResponses / stats.totalRequests;
    } else if (stats.responseRate) {
        // Fallback for untracked legacy
        rate = stats.responseRate / 100;
    }

    if (rate > 0.7) score += 20;
    else if (rate > 0.4) score += 10;

    // 4. Active Recently < 2h (+15)
    // Check real lastActiveAt or default
    const lastActive = stats.lastActiveAt ? new Date(stats.lastActiveAt) : new Date();
    const hoursSinceActive = (new Date() - lastActive) / (1000 * 60 * 60);

    // Only give points if within 2 hours
    if (stats.lastActiveAt && hoursSinceActive < 2) score += 15;
    // For now, if no lastActiveAt, assume not active recently unless in legacy default flow (which we are migrating away from)

    // Labeling
    let label = 'Low';
    if (score >= 80) label = 'High';
    else if (score >= 50) label = 'Medium';

    return {
        score,
        label,
        text: stats.avgResponseTime && stats.avgResponseTime < 45 ? `Usually responds within ${Math.round(stats.avgResponseTime)} mins` : 'Responses may be slow'
    };
};

// Helper: Calculate STOCK Confidence (Step 4)
const calculateStockConfidence = (product, seller) => {
    // 1. Base Inputs
    const currentStock = product.quantity || 0;
    const baselineStock = product.baselineStock || currentStock; // Fallback
    const operatingMode = seller?.shopDetails?.operatingMode || 'GUARANTEED';
    const inventoryType = product.inventoryType;

    // 1. Rush mode overrides everything
    if (operatingMode === 'RUSH') {
        return 'LOW';
    }

    // 2. Guaranteed mode overrides inventory type
    if (operatingMode === 'GUARANTEED') {
        if (currentStock > 0) return 'HIGH';
        return 'LOW';
    }

    // 3. Best-effort mode uses stock levels
    if (operatingMode === 'BEST_EFFORT') {
        if (currentStock === 0) return 'LOW';
        if (currentStock <= baselineStock * 0.5) return 'MEDIUM';
        return 'HIGH';
    }

    // fallback (should not happen)
    return 'LOW';
};

// Helper: Calculate Ranking Score (Step 7)
const calculateRankingScore = (shop, sellerStats) => {
    let score = 0;

    // 1. Subscription Boost
    const planId = (shop.subscription?.planId || 'free').toUpperCase();
    if (planId === 'PRO') score += 30;
    else if (planId === 'GROWTH') score += 15;

    // 2. Rush Mode Penalty (Neutralize Subscription Boost)
    if (shop.shopDetails?.operatingMode === 'RUSH') {
        score = 0; // Reset any subscription advantage during rush
    }

    // 3. Availability / status base (already handled in distance metric usually, but adding small base)
    if (shop.shopDetails?.isOpen) score += 10;

    // 4. Dispute Penalty (Silent Trust Impact)
    // If disputes > 5% of total orders (approx), deduct score
    if (sellerStats) {
        const { totalDisputes, totalResponses } = sellerStats;
        // Using 'totalResponses' as proxy for total orders for now, or just raw count
        if (totalDisputes > 0) {
            const disputeRate = totalResponses > 0 ? (totalDisputes / totalResponses) : 0;
            if (disputeRate > 0.05) { // More than 5% dispute rate
                score -= 20; // Heavy silent penalty
            }
        }
    }

    return score;
};

module.exports = { calculateSellerConfidence, calculateStockConfidence, calculateRankingScore };
