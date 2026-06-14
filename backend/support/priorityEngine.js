/**
 * Maps support intents and categories to priority levels: LOW, MEDIUM, HIGH, CRITICAL.
 * Dynamically upgrades priority if specific urgent keywords are matched in the description.
 */
const priorityEngine = (intent, category, rawText = '') => {
    let priority = 'medium'; // Default fallback

    const basePriorities = {
        // Security & Fraud -> CRITICAL
        FRAUD_PAYMENT: 'critical',
        SECURITY_ISSUE: 'critical',

        // Login & Bank Settlements -> HIGH
        LOGIN_ISSUES: 'high',
        PAYMENT_PENDING: 'high',
        PAYOUT_ISSUE: 'high',

        // System Visibility & Sales -> MEDIUM
        PRODUCT_VISIBILITY: 'medium',
        SHOP_STATUS: 'medium',
        SALES_TRACKING: 'medium',

        // Content & Minor Setup -> LOW
        PRODUCT_ADDITION: 'low',
        IMAGE_UPLOAD: 'low',
        IMAGE_QUALITY: 'low',
        OFFER_VISIBILITY: 'low'
    };

    if (basePriorities[intent]) {
        priority = basePriorities[intent];
    } else if (category === 'SECURITY') {
        priority = 'critical';
    } else if (category === 'PAYMENTS') {
        priority = 'high';
    }

    // Urgency Keyword Analysis (Upgrade trigger)
    const text = (rawText || '').toLowerCase();
    const urgentKeywords = ['urgent', 'emergency', 'fraud', 'scam', 'hacked', 'stolen', 'suspicious', 'immediate', 'leak', 'locked'];
    const hasUrgency = urgentKeywords.some(kw => text.includes(kw));

    if (hasUrgency) {
        if (priority === 'low') {
            priority = 'medium';
        } else if (priority === 'medium') {
            priority = 'high';
        } else if (priority === 'high') {
            priority = 'critical';
        }
    }

    return priority.toUpperCase();
};

module.exports = priorityEngine;
