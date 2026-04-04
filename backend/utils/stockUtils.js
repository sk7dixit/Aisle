/**
 * CALCULATE STOCK STATUS (SINGLE SOURCE OF TRUTH)
 * 
 * Rules:
 * 1. Quantity Check (0 = OUT)
 * 2. Threshold Check (<= 50% of Initial Stock = LIMITED)
 * 3. Otherwise = IN_STOCK
 */
const calculateStockStatus = (quantity, baselineStock) => {
    const q = Number(quantity || 0);
    // Baseline fallback: if no baseline, try quantity (legacy safe)
    // Note: Mongoose pre-save fixes this, but this is safe for pure utilities
    const b = Number(baselineStock || 0);

    if (q === 0) return 'OUT_OF_STOCK';

    // Rule: Limited if <= 50% of Baseline (Reference)
    // If baseline is 0 (edge case), threshold is 0.
    const threshold = Math.floor(b / 2);

    if (q <= threshold) return 'LIMITED';
    return 'IN_STOCK';
};

const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    return today > exp;
};

const getExpiryWarning = (expiryDate) => {
    if (!expiryDate) return null;
    if (isExpired(expiryDate)) return "EXPIRED";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
        return `Expires in ${diffDays} days`;
    }
    return null;
};

module.exports = { calculateStockStatus, isExpired, getExpiryWarning };
