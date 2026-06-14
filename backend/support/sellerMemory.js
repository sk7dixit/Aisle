const SellerMemory = require('../models/SellerMemory');

/**
 * Increments the count of a particular issue type in a seller's persistent memory.
 */
const saveIssueToMemory = async (sellerId, issueType) => {
    try {
        let memory = await SellerMemory.findOne({ sellerId });
        if (!memory) {
            memory = new SellerMemory({ sellerId, recurringIssues: [] });
        }

        const cleanType = issueType.toUpperCase();
        const existing = memory.recurringIssues.find(r => r.issueType === cleanType);
        if (existing) {
            existing.count += 1;
            existing.lastOccurred = new Date();
        } else {
            memory.recurringIssues.push({ issueType: cleanType, count: 1, lastOccurred: new Date() });
        }

        await memory.save();
        return memory;
    } catch (err) {
        console.error('Error saving issue to memory:', err);
    }
};

/**
 * Formulates a tailored greeting if the seller has recurring problems.
 */
const getRecurringIssueGreeting = async (sellerId) => {
    try {
        const memory = await SellerMemory.findOne({ sellerId });
        if (!memory || !memory.recurringIssues || memory.recurringIssues.length === 0) {
            return null;
        }

        // Sort by occurrence count descending
        const sorted = [...memory.recurringIssues].sort((a, b) => b.count - a.count);
        const topIssue = sorted[0];

        if (topIssue && topIssue.count >= 2) {
            let label = topIssue.issueType.toLowerCase();
            if (label.includes('payment') || label.includes('payout')) {
                return `Welcome back. You previously experienced payout issues caused by incomplete bank verification. Would you like me to check that first?`;
            } else if (label.includes('product') || label.includes('visibility')) {
                return `Welcome back. You previously had questions about product visibility and stock levels. Would you like me to run a quick inventory status check?`;
            } else if (label.includes('shop') || label.includes('closed')) {
                return `Welcome back. You previously had questions about your shop operating hours and visibility status. Shall I diagnose your shop scheduler first?`;
            }
        }
        return null;
    } catch (err) {
        console.error('Error fetching recurring issue greeting:', err);
        return null;
    }
};

module.exports = {
    saveIssueToMemory,
    getRecurringIssueGreeting
};
