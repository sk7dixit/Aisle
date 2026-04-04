const User = require('../models/User');

/**
 * Simulates AI verification logic for a seller.
 * @param {Object} sellerData - The seller data to verify.
 * @returns {Promise<Object>} - AI verification result: { status: String, reason: String }
 */
const runAIVerification = async (sellerData) => {
    console.log(`[AI Verification] Processing seller: ${sellerData.name} (${sellerData._id})`);

    // Simulate async processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // STUB LOGIC:
    // 1. If name is missing or too short -> needs_review
    // 2. If shopName is 'TEST' -> rejected_by_system
    // 3. Otherwise -> approved

    if (!sellerData.name || sellerData.name.length < 2) {
        return {
            status: 'needs_review',
            reason: 'Name is too short or missing.'
        };
    }

    if (sellerData.shopDetails?.shopName?.toUpperCase().includes('TEST')) {
        return {
            status: 'rejected_by_system',
            reason: 'Test shops are not permitted on the platform.'
        };
    }

    // Default: Approval
    return {
        status: 'approved',
        reason: 'Automated AI check passed.'
    };
};

/**
 * Orchestrates the AI verification and saves the result to the database.
 * @param {String} userId - The ID of the user to verify.
 */
const triggerAIVerification = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || user.role !== 'seller') {
            console.error(`[AI Verification] User ${userId} not found or is not a seller.`);
            return;
        }

        const aiResult = await runAIVerification(user);

        // Map AI result to Model states (Step 2 Requirements)
        if (aiResult.status === 'approved') {
            user.verificationStatus = 'approved';
            user.verificationReason = aiResult.reason || 'Automated approval';
        } else if (aiResult.status === 'needs_review') {
            user.verificationStatus = 'needs_review';
            user.verificationReason = 'inconclusive';
        } else if (aiResult.status === 'rejected_by_system') {
            user.verificationStatus = 'rejected_by_system';
            user.verificationReason = 'invalid_or_suspicious_data';
        }

        user.verificationSource = 'ai';

        await user.save();
        console.log(`[AI Verification] Result saved for user ${userId}: ${user.verificationStatus}`);
    } catch (error) {
        console.error(`[AI Verification] Error for user ${userId}:`, error);
    }
};

module.exports = {
    runAIVerification,
    triggerAIVerification
};
