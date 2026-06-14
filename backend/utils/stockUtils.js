/**
 * CALCULATE STOCK STATUS (SINGLE SOURCE OF TRUTH)
 * 
 * Rules:
 * 1. Quantity Check (0 = OUT)
 * 2. Threshold Check (<= 50% of Initial Stock = LIMITED)
 * 3. Otherwise = IN_STOCK
 */
const calculateStockStatus = (quantity, baselineStock) => {
    let q, b;
    if (quantity && typeof quantity === 'object') {
        // Support both document/object structures, fallback countInStock to quantity
        const count = quantity.quantity !== undefined ? quantity.quantity : (quantity.countInStock !== undefined ? quantity.countInStock : 0);
        q = Number(count || 0);
        b = Number(quantity.baselineStock !== undefined ? quantity.baselineStock : (quantity.initialStock !== undefined ? quantity.initialStock : q));

        // Expiry check for EXPIRY_BASED products
        if (quantity.productType === 'EXPIRY_BASED' && quantity.expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const exp = new Date(quantity.expiryDate);
            exp.setHours(0, 0, 0, 0);
            if (today > exp) {
                return 'OUT_OF_STOCK';
            }
        }
    } else {
        q = Number(quantity || 0);
        b = Number(baselineStock || 0);
    }

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
