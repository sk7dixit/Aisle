const User = require('../models/User');
const Product = require('../models/Product');
const SecurityEvent = require('../models/SecurityEvent');
const { logSecurityEvent } = require('./securityLogger');

/**
 * Calculates the signup risk score for a combination of IP and Device ID.
 * @param {string} ip - Client IP Address
 * @param {string} deviceId - Client Device Fingerprint ID
 * @returns {Promise<Object>} Object containing score (0-100) and risk level
 */
const calculateSignupRiskScore = async (ip, deviceId) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Count users created in the past 24 hours from same IP or Device ID
        const sameIpCount = await User.countDocuments({
            createdAt: { $gte: twentyFourHoursAgo },
            $or: [
                { 'shopDetails.ipAddress': ip }, // simulated location
                { ipAddress: ip }
            ]
        });

        // Search in SecurityLogs for creations if User records lack IP details
        const SecurityLog = require('../models/SecurityLog');
        const securityLogsCount = await SecurityLog.countDocuments({
            event: 'USER_CREATED',
            ipAddress: ip,
            createdAt: { $gte: twentyFourHoursAgo }
        });

        const maxAccountsFromIp = Math.max(sameIpCount, securityLogsCount);
        
        let score = 10; // Base normal score
        
        if (maxAccountsFromIp >= 2 && maxAccountsFromIp <= 5) {
            score = 45; // Suspicious (Medium Risk)
        } else if (maxAccountsFromIp > 5) {
            score = 85; // Fraudulent (High Risk)
        }

        // Additional points for missing device fingerprint
        if (!deviceId || deviceId === 'unknown') {
            score += 10;
        }

        score = Math.min(100, score);
        let risk = 'low';
        if (score > 60) risk = 'high';
        else if (score > 30) risk = 'medium';

        return { score, risk };
    } catch (err) {
        console.error('[FraudEngine] Error calculating signup risk score:', err.message);
        return { score: 10, risk: 'low' };
    }
};

/**
 * Calculates a seller's risk score based on inventory uploads and shop velocity.
 * @param {string} sellerId - The ID of the seller/user
 * @returns {Promise<Object>} Object containing score (0-100) and risk level
 */
const calculateSellerRiskScore = async (sellerId) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const user = await User.findById(sellerId);
        if (!user) return { score: 0, risk: 'low' };

        // 1. Check product upload velocity in last 24h
        const Product = require('../models/Product');
        const uploadCount = await Product.countDocuments({
            seller: sellerId,
            createdAt: { $gte: twentyFourHoursAgo }
        });

        let score = 15; // Base normal score
        
        if (uploadCount >= 10000) {
            score = 95; // Extreme mass product spamming (Fraud)
        } else if (uploadCount >= 1000) {
            score = 75; // Suspicious upload velocity (High Risk)
        } else if (uploadCount >= 100) {
            score = 40; // Moderate upload velocity (Medium Risk)
        }

        // 2. Check shop creation velocity (How many shops has this seller created?)
        // Assuming user can represent multiple shops or has created multiple accounts.
        // Check if there are other seller accounts with the exact same phone or details
        if (user.phone) {
            const similarSellers = await User.countDocuments({
                role: 'seller',
                phone: user.phone,
                _id: { $ne: sellerId }
            });
            if (similarSellers > 2) {
                score += 30; // Phone number reused across multiple shops
            }
        }

        score = Math.min(100, score);
        let risk = 'low';
        if (score > 60) risk = 'high';
        else if (score > 30) risk = 'medium';

        // Auto-suspend action for high risk sellers (score >= 80)
        if (score >= 80 && user.verificationStatus !== 'suspended') {
            user.verificationStatus = 'suspended';
            user.verificationReason = `Auto-suspended by Fraud Engine: Risk score is ${score}`;
            if (user.shopDetails) user.shopDetails.isOpen = false;
            await user.save();

            await logSecurityEvent(user._id, user.email, 'FRAUD_DETECTED', null, {
                reason: `Seller auto-suspended: High Fraud score (${score})`,
                uploadCount,
                sellerId
            });

            // Propagate seller suspension immediately across all nodes
            try {
                const { publishEvent } = require('./eventBus');
                await publishEvent('SELLER_STATUS_CHANGED', { sellerId: user._id.toString(), status: 'suspended' });
            } catch (busErr) {
                console.error('[FraudEngine-EventBus] Failed to publish suspension event:', busErr.message);
            }
        }

        return { score, risk, uploadCount };
    } catch (err) {
        console.error('[FraudEngine] Error calculating seller risk score:', err.message);
        return { score: 15, risk: 'low' };
    }
};

module.exports = {
    calculateSignupRiskScore,
    calculateSellerRiskScore
};
