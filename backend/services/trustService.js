const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Request = require('../models/Request');
const Order = require('../models/Order');
const SellerTrust = require('../models/SellerTrust');
const CustomerTrust = require('../models/CustomerTrust');
const RiskProfile = require('../models/RiskProfile');
const FraudEvent = require('../models/FraudEvent');

/**
 * Recalculate Trust Score for a Seller
 */
const calculateSellerTrust = async (sellerId) => {
    try {
        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') return null;

        // 1. Response Time Score (15%)
        const avgResp = seller.sellerStats?.avgResponseTime;
        let responseTimeScore = 85; // Default fallback
        if (avgResp !== undefined && avgResp !== null) {
            if (avgResp <= 5) responseTimeScore = 100;
            else if (avgResp <= 15) responseTimeScore = 90;
            else if (avgResp <= 30) responseTimeScore = 75;
            else if (avgResp <= 60) responseTimeScore = 60;
            else responseTimeScore = 40;
        }

        // 2. Stock Accuracy Score (Inventory Reliability) (20%)
        const totalReqs = await Request.countDocuments({ sellerId });
        const rejectedReqs = await Request.countDocuments({ sellerId, status: 'REJECTED' });
        const stockAccuracyScore = totalReqs > 0 
            ? Math.round(((totalReqs - rejectedReqs) / totalReqs) * 100) 
            : 100;

        // 3. Completion Rate Score (20%)
        const totalOrders = await Order.countDocuments({ sellerId });
        const completedOrders = await Order.countDocuments({ sellerId, status: { $in: ['FULFILLED', 'COMPLETED'] } });
        const cancelledOrders = await Order.countDocuments({ sellerId, status: 'CANCELLED' });
        const completionRateScore = (completedOrders + cancelledOrders) > 0
            ? Math.round((completedOrders / (completedOrders + cancelledOrders)) * 100)
            : 95;

        // 4. Account Age Score (10%)
        const createdDate = seller.createdAt || new Date();
        const daysActive = Math.max(1, Math.round((Date.now() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24)));
        let ageScore = 60;
        if (daysActive >= 180) ageScore = 100;
        else if (daysActive >= 90) ageScore = 90;
        else if (daysActive >= 30) ageScore = 80;
        else if (daysActive >= 7) ageScore = 70;

        // 5. Verification Status Score (15%)
        let verificationScore = 60; // default for pending
        const vStatus = seller.verificationStatus || 'pending';
        if (vStatus === 'approved') verificationScore = 100;
        else if (vStatus === 'needs_review') verificationScore = 40;
        else if (vStatus === 'rejected_by_system') verificationScore = 0;

        // 6. Customer Feedback Score (10%)
        const rating = seller.shopDetails?.rating || 4.0;
        const feedbackScore = Math.round((rating / 5) * 100);

        // 7. Disputes Score (10%)
        const disputesCount = seller.sellerStats?.totalDisputes || 0;
        const disputesScore = Math.max(0, 100 - (disputesCount * 15));

        // Aggregate Weighted Score
        const trustScore = Math.round(
            (responseTimeScore * 0.15) +
            (stockAccuracyScore * 0.20) +
            (completionRateScore * 0.20) +
            (ageScore * 0.10) +
            (verificationScore * 0.15) +
            (feedbackScore * 0.10) +
            (disputesScore * 0.10)
        );

        // Save to SellerTrust
        const trustDoc = await SellerTrust.findOneAndUpdate(
            { sellerId },
            {
                $set: {
                    trustScore,
                    responseTimeScore,
                    stockAccuracyScore,
                    completionRateScore,
                    verificationStatusScore: verificationScore,
                    disputesScore,
                    customerFeedbackScore: feedbackScore,
                    lastCalculated: new Date()
                },
                $push: {
                    history: {
                        $each: [{ score: trustScore, date: new Date() }],
                        $slice: -12 // keep last 12 entries
                    }
                }
            },
            { upsert: true, new: true }
        );

        // Update user stats
        await User.findByIdAndUpdate(sellerId, {
            'sellerStats.confidenceScore': trustScore
        });

        // Trigger Risk profile recalculation as well
        await calculateUserRiskScore(sellerId);

        return trustDoc;
    } catch (error) {
        console.error(`[TrustService] Error calculating seller trust for ${sellerId}:`, error.message);
        return null;
    }
};

/**
 * Recalculate Trust Score for a Customer
 */
const calculateCustomerTrust = async (customerId) => {
    try {
        const customer = await User.findById(customerId);
        if (!customer) return null;

        // Start from base 100
        let score = 100;

        // Deductions based on cancellation and report events
        const cancellationsCount = await Order.countDocuments({ customerId, status: 'CANCELLED' });
        const spamRequestsCount = await FraudEvent.countDocuments({ userId: customerId, eventType: 'spam_requests' });
        
        // Cancellation penalty: -5 per cancel (cap at 25)
        const cancellationPenalty = Math.min(25, cancellationsCount * 5);
        // Spam penalty: -15 per block (cap at 45)
        const spamPenalty = Math.min(45, spamRequestsCount * 15);
        // Abusive behavior: we look up details or reports (let's check reports count or fallback to 0)
        const reportHistoryCount = await FraudEvent.countDocuments({ userId: customerId, eventType: 'multi_account_abuse' });
        const abusePenalty = Math.min(30, reportHistoryCount * 15);

        score = Math.max(0, score - cancellationPenalty - spamPenalty - abusePenalty);

        const trustDoc = await CustomerTrust.findOneAndUpdate(
            { customerId },
            {
                $set: {
                    trustScore: score,
                    spamRequestsCount,
                    fakeInquiriesCount: 0,
                    abusiveBehaviorCount: abusePenalty > 0 ? 1 : 0,
                    cancellationsCount,
                    reportHistoryCount,
                    lastCalculated: new Date()
                },
                $push: {
                    history: {
                        $each: [{ score, date: new Date() }],
                        $slice: -12
                    }
                }
            },
            { upsert: true, new: true }
        );

        await calculateUserRiskScore(customerId);

        return trustDoc;
    } catch (error) {
        console.error(`[TrustService] Error calculating customer trust for ${customerId}:`, error.message);
        return null;
    }
};

/**
 * Check and calculate User aggregate Risk Score (0-100)
 */
const calculateUserRiskScore = async (userId) => {
    try {
        // Fetch trust scores
        const sellerTrust = await SellerTrust.findOne({ sellerId: userId });
        const customerTrust = await CustomerTrust.findOne({ customerId: userId });
        const trustScore = sellerTrust ? sellerTrust.trustScore : (customerTrust ? customerTrust.trustScore : 85);

        // Risk starts as inverse of Trust
        let riskScore = 100 - trustScore;

        const reasons = [];

        // Add risk weighting based on fraud events
        const pendingFraudCount = await FraudEvent.countDocuments({ userId, status: 'pending_moderation' });
        if (pendingFraudCount > 0) {
            riskScore += (pendingFraudCount * 20);
            reasons.push(`${pendingFraudCount} pending fraud moderation alerts`);
        }

        // Check if seller details have verification reviews
        const seller = await User.findById(userId);
        if (seller && seller.role === 'seller') {
            if (seller.verificationStatus === 'needs_review') {
                riskScore += 15;
                reasons.push('Seller profile verification marked needs review');
            }
            if (seller.accountStatus === 'suspended') {
                riskScore = 95;
                reasons.push('Seller is currently suspended');
            }
        }

        riskScore = Math.max(0, Math.min(100, riskScore));

        let riskLevel = 'low';
        if (riskScore >= 75) riskLevel = 'critical';
        else if (riskScore >= 50) riskLevel = 'high';
        else if (riskScore >= 25) riskLevel = 'medium';

        const profile = await RiskProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    riskScore,
                    riskLevel,
                    reasons,
                    lastCalculated: new Date()
                }
            },
            { upsert: true, new: true }
        );

        return profile;
    } catch (error) {
        console.error(`[TrustService] Error calculating risk score for ${userId}:`, error.message);
        return null;
    }
};

/**
 * Task 4: Duplicate Seller Detection
 */
const detectDuplicateSellers = async (sellerId) => {
    try {
        const currentSeller = await User.findById(sellerId);
        if (!currentSeller || currentSeller.role !== 'seller') return [];

        const currentUpi = currentSeller.shopDetails?.upiId;
        const currentFace = currentSeller.faceData;

        // Check matching properties
        const matchConditions = [];
        if (currentUpi) {
            matchConditions.push({ 'shopDetails.upiId': currentUpi });
        }
        if (currentFace) {
            matchConditions.push({ faceData: currentFace });
        }

        if (matchConditions.length === 0) return [];

        // Find duplicate matches excluding self
        const duplicates = await User.find({
            _id: { $ne: sellerId },
            role: 'seller',
            $or: matchConditions
        }).select('_id name email shopDetails');

        if (duplicates.length > 0) {
            // Log a Fraud Event
            const dupEmails = duplicates.map(d => d.email).join(', ');
            await FraudEvent.create({
                userId: sellerId,
                eventType: 'duplicate_seller',
                severity: 'high',
                details: {
                    matchedCount: duplicates.length,
                    matchedAccounts: duplicates.map(d => ({ id: d._id, email: d.email, name: d.name })),
                    reason: `Shared UPI credential or biometric faceData identifier with: ${dupEmails}`
                }
            });

            // Adjust verification flag
            await User.findByIdAndUpdate(sellerId, {
                verificationStatus: 'needs_review',
                verificationReason: 'System flagged duplicate credential registration'
            });

            await calculateSellerTrust(sellerId);
        }

        return duplicates;
    } catch (error) {
        console.error(`[TrustService] Duplicate seller check failed for ${sellerId}:`, error.message);
        return [];
    }
};

/**
 * Multi-Account Detection
 */
const detectMultiAccountAbuse = async (userId, deviceId, req) => {
    try {
        if (!deviceId || deviceId === 'unknown_device') return { blocked: false };
        
        // Find all users who have lastDeviceId === deviceId
        const linkedUsers = await User.find({ lastDeviceId: deviceId }).select('_id name email');
        if (linkedUsers.length >= 5) {
            // Create fraud event
            const emails = linkedUsers.map(u => u.email).join(', ');
            const exist = await FraudEvent.findOne({ userId, eventType: 'multi_account_abuse' });
            if (!exist) {
                await FraudEvent.create({
                    userId,
                    eventType: 'multi_account_abuse',
                    severity: 'high',
                    status: 'pending_moderation',
                    details: {
                        deviceId,
                        linkedCount: linkedUsers.length,
                        linkedAccounts: linkedUsers.map(u => ({ id: u._id, email: u.email })),
                        reason: `Multi-account cluster: 5+ accounts matched to single device fingerprint: ${emails}`
                    }
                });
                
                // Reduce trust and increase risk
                await calculateCustomerTrust(userId);
                await calculateSellerTrust(userId);
            }
            return { blocked: true, reason: 'Multi-account containment triggered.' };
        }
        return { blocked: false };
    } catch (err) {
        console.error('[TrustService] Multi-account check error:', err.message);
        return { blocked: false };
    }
};

/**
 * Referral Abuse Detection
 */
const detectReferralAbuse = async (userId, referrerId, deviceId, req) => {
    try {
        if (!deviceId || deviceId === 'unknown_device') return { blocked: false };
        
        const referralCount = await FraudEvent.countDocuments({
            eventType: 'promotion_abuse',
            'details.deviceId': deviceId,
            'details.referral': true
        });

        if (referralCount >= 5) {
            await FraudEvent.create({
                userId,
                eventType: 'promotion_abuse',
                severity: 'high',
                status: 'pending_moderation',
                details: {
                    deviceId,
                    referral: true,
                    referrerId,
                    reason: `Referral farming detected: 5+ signups/claims linked to device fingerprint: ${deviceId}`
                }
            });
            await calculateCustomerTrust(userId);
            return { blocked: true, reason: 'Referral reward blocked: device limit exceeded.' };
        }
        
        await FraudEvent.create({
            userId,
            eventType: 'promotion_abuse',
            severity: 'low',
            status: 'resolved',
            details: {
                deviceId,
                referral: true,
                referrerId,
                reason: `Referral signup registered on device ${deviceId}`
            }
        });
        
        return { blocked: false };
    } catch (err) {
        console.error('[TrustService] Referral abuse check failed:', err.message);
        return { blocked: false };
    }
};

/**
 * Review Manipulation Detection
 */
const detectReviewManipulation = async (customerId, shopId, deviceId, rating, comment, req) => {
    try {
        if (!deviceId || deviceId === 'unknown_device') return { isFraud: false };

        const count = await Review.countDocuments({ shopId, deviceId });

        if (count >= 5) {
            await Review.updateMany(
                { shopId, deviceId },
                { $set: { isSuspicious: true, suspiciousReason: 'Review manipulation alert: multiple submissions from same device' } }
            );

            await FraudEvent.create({
                userId: shopId,
                eventType: 'fake_reviews',
                severity: 'high',
                status: 'pending_moderation',
                details: {
                    deviceId,
                    offendingCustomer: customerId,
                    count: count + 1,
                    reason: `Review ring anomaly: ${count + 1} reviews placed from identical device fingerprint ${deviceId} for shop.`
                }
            });

            await calculateSellerTrust(shopId);

            return {
                isFraud: true,
                reason: 'Review submission blocked: extreme volume of submissions from single hardware signature.'
            };
        }
        return { isFraud: false };
    } catch (err) {
        console.error('[TrustService] Review manipulation check failed:', err.message);
        return { isFraud: false };
    }
};

/**
 * Task 5 & 10: Spam Request & AI Fraud Velocity Check
 */
const detectSpamAndFraud = async (customerId, productId, sellerId, req) => {
    try {
        // Retrieve client device identifier and IP
        const deviceId = req.headers['x-device-id'] || req.body?.deviceId || 'unknown_device';
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';

        // Update user device footprint
        if (deviceId !== 'unknown_device') {
            await User.findByIdAndUpdate(customerId, {
                lastDeviceId: deviceId,
                lastIp: clientIp
            });
            // Run Multi-Account Abuse check
            await detectMultiAccountAbuse(customerId, deviceId, req);
        }

        // 1. Check if user is already suspended/critical risk
        const riskProfile = await RiskProfile.findOne({ userId: customerId });
        if (riskProfile && riskProfile.riskScore >= 80) {
            return {
                blocked: true,
                challengeRequired: true,
                reason: 'Security containment: Your account has been restricted due to anomalous patterns.'
            };
        }

        // 2. Velocity Check - Last 1 Minute (Spam rate limit check)
        const oneMinAgo = new Date(Date.now() - 60 * 1000);
        const count1Min = await Request.countDocuments({
            customerId,
            createdAt: { $gte: oneMinAgo }
        });

        if (count1Min >= 5) {
            await FraudEvent.create({
                userId: customerId,
                eventType: 'spam_requests',
                severity: 'medium',
                details: {
                    ip: clientIp,
                    deviceId,
                    rate: `${count1Min} requests/min`,
                    reason: 'Velocity check triggered: request rate exceeded 5 items per minute.'
                }
            });

            await calculateCustomerTrust(customerId);

            return {
                blocked: true,
                challengeRequired: true,
                reason: 'Spam rate limit triggered. Please wait 60 seconds before placing another request.'
            };
        }

        // 3. Velocity Check - Last 1 Hour (AI Fraud Detection Check)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const count1Hour = await Request.countDocuments({
            customerId,
            createdAt: { $gte: oneHourAgo }
        });

        if (count1Hour >= 25) {
            await FraudEvent.create({
                userId: customerId,
                eventType: 'spam_requests',
                severity: 'high',
                details: {
                    ip: clientIp,
                    deviceId,
                    rate: `${count1Hour} requests/hour`,
                    reason: 'AI anomaly detection triggered: extreme request velocity (exceeded 25/hour).'
                }
            });

            await calculateCustomerTrust(customerId);

            return {
                blocked: true,
                challengeRequired: true,
                reason: 'Anomalous velocity detected. Please contact help desk to verify your account.'
            };
        }

        return { blocked: false };
    } catch (error) {
        console.error('[TrustService] Error running request spam checks:', error.message);
        return { blocked: false };
    }
};

/**
 * Task 12: Review Integrity Engine
 */
const validateReviewIntegrity = async (customerId, shopId, rating, comment, req) => {
    try {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';
        const deviceId = req.headers['x-device-id'] || req.body?.deviceId || 'unknown_device';

        // Update user device footprint
        if (deviceId !== 'unknown_device') {
            await User.findByIdAndUpdate(customerId, {
                lastDeviceId: deviceId,
                lastIp: clientIp
            });
            // Run Multi-Account Abuse check
            await detectMultiAccountAbuse(customerId, deviceId, req);
        }

        // 1. Self Review Check
        if (customerId.toString() === shopId.toString()) {
            return {
                isFraud: true,
                reason: 'Self-reviews are blocked. You cannot review your own store.'
            };
        }

        // 2. Co-location & Same Device Check
        const seller = await User.findById(shopId);
        if (seller) {
            const sameDevice = deviceId !== 'unknown_device' && seller.shopDetails?.visualAssets?.some(a => a.deviceId === deviceId);
            if (sameDevice) {
                // Log review integrity fraud
                await FraudEvent.create({
                    userId: shopId,
                    eventType: 'fake_reviews',
                    severity: 'high',
                    details: {
                        customerId,
                        rating,
                        comment,
                        reason: 'Review ring trigger: Review placed from identical physical device as the shop owner.'
                    }
                });

                await calculateSellerTrust(shopId);

                return {
                    isFraud: true,
                    reason: 'Review submission rejected: Co-located device verification mismatch.'
                };
            }
        }

        // 3. Review Manipulation Check (5+ reviews from same device cluster)
        const manipulationCheck = await detectReviewManipulation(customerId, shopId, deviceId, rating, comment, req);
        if (manipulationCheck.isFraud) {
            return {
                isFraud: true,
                reason: manipulationCheck.reason
            };
        }

        return { isFraud: false };
    } catch (error) {
        console.error('[TrustService] Review integrity check failed:', error.message);
        return { isFraud: false };
    }
};

/**
 * Task 8 & 9: Multi-Account & Promotion Abuse Detection
 */
const detectPromotionAbuse = async (userId, couponCode, req) => {
    try {
        const deviceId = req.headers['x-device-id'] || req.body?.deviceId || 'unknown_device';
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';

        if (deviceId === 'unknown_device') return { blocked: false };

        // Check if other accounts used this coupon on the same device
        const previousOrders = await Order.find({
            couponCode,
            deviceId,
            customerId: { $ne: userId }
        }).select('customerId').lean();

        if (previousOrders.length > 0) {
            const matchedUsers = previousOrders.map(o => o.customerId.toString());
            const uniqueUsers = [...new Set(matchedUsers)];

            if (uniqueUsers.length >= 2) {
                // Raise fraud event
                await FraudEvent.create({
                    userId,
                    eventType: 'promotion_abuse',
                    severity: 'high',
                    details: {
                        couponCode,
                        deviceId,
                        clientIp,
                        linkedAccounts: uniqueUsers,
                        reason: `Promotion farming detected: Coupon code "${couponCode}" claimed by ${uniqueUsers.length} accounts on a single physical device.`
                    }
                });

                await calculateCustomerTrust(userId);

                return {
                    blocked: true,
                    reason: 'Coupon promotion ineligible: Multi-account device limit exceeded.'
                };
            }
        }

        return { blocked: false };
    } catch (error) {
        console.error('[TrustService] Promotion abuse check failed:', error.message);
        return { blocked: false };
    }
};

/**
 * Task 14: AI Moderation Copilot reasoning compiler
 */
const getModerationCopilotDecision = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return 'User account not found.';

        const riskProfile = await RiskProfile.findOne({ userId });
        const fraudEvents = await FraudEvent.find({ userId }).sort({ createdAt: -1 });

        if (fraudEvents.length === 0) {
            return `AI Assistant Report:\n- The account associated with "${user.name}" (${user.email}) displays healthy operation indicators.\n- Risk Score is ${riskProfile ? riskProfile.riskScore : 10}/100 (Low Risk).\n- No anomalous triggers registered.`;
        }

        // Generate forensic summaries
        const duplicateSeller = fraudEvents.find(e => e.eventType === 'duplicate_seller');
        const spamReqs = fraudEvents.filter(e => e.eventType === 'spam_requests');
        const fakeReviews = fraudEvents.find(e => e.eventType === 'fake_reviews');
        const promoAbuse = fraudEvents.find(e => e.eventType === 'promotion_abuse');

        let report = `### AI Moderation Forensic Summary\n\n`;
        report += `Account Name: **${user.name}**\n`;
        report += `Status: **${user.accountStatus.toUpperCase()}** | Risk Level: **${riskProfile?.riskLevel?.toUpperCase() || 'LOW'}** (${riskProfile?.riskScore || 10}/100)\n\n`;
        report += `#### Anomaly Audit Findings:\n`;

        if (duplicateSeller) {
            report += `- **Duplicate Seller Match:** Sharing hardware device identifiers, biometric templates, or UPI registration fields with multiple accounts: ${duplicateSeller.details?.reason}\n`;
        }
        if (spamReqs.length > 0) {
            report += `- **Request Velocity Anomaly:** Suppressed ${spamReqs.length} rate-limit bursts. Peak rate reached ${spamReqs[0].details?.rate} originating from IP/subnet ${spamReqs[0].details?.ip}.\n`;
        }
        if (fakeReviews) {
            report += `- **Review Integrity Breach:** Detected self-reviewing or device co-location loop matching seller metadata: ${fakeReviews.details?.reason}\n`;
        }
        if (promoAbuse) {
            report += `- **Coupon Farming Logged:** Promotional coupon codes claimed across ${promoAbuse.details?.linkedAccounts?.length} different customer logins using identical browser signatures.\n`;
        }

        report += `\n**AI Recommendation:** `;
        if (riskProfile && riskProfile.riskScore >= 75) {
            report += `🚨 **IMMEDIATE CONTAINMENT SUGGESTED.** Flagged metrics cross the critical risk boundary. Recommend full seller suspension and bank credential audit.`;
        } else if (riskProfile && riskProfile.riskScore >= 40) {
            report += `⚠️ **MODERATOR REVIEW SUGGESTED.** Downgrade catalog placements and trigger verification review.`;
        } else {
            report += `✓ **MONITORING MODE.** Maintain low-level security watch. No actions required.`;
        }

        return report;
    } catch (error) {
        console.error('[TrustService] AI Copilot compiler error:', error.message);
        return 'AI Copilot compiler encountered an error.';
    }
};

/**
 * Task 7: Marketplace Quality Score by Area/City
 */
const calculateMarketplaceQualityScore = async (city, area) => {
    try {
        const query = { role: 'seller' };
        if (city) query['shopDetails.location.city'] = new RegExp(`^${city}$`, 'i');
        if (area) query['shopDetails.address'] = new RegExp(area, 'i');

        const sellers = await User.find(query).select('_id');
        if (sellers.length === 0) return 90; // Default healthy score

        const sellerIds = sellers.map(s => s._id);
        const trustDocs = await SellerTrust.find({ sellerId: { $in: sellerIds } });

        if (trustDocs.length === 0) return 85;

        const sum = trustDocs.reduce((acc, curr) => acc + curr.trustScore, 0);
        return Math.round(sum / trustDocs.length);
    } catch (error) {
        console.warn('[TrustService] Quality score calculate error:', error.message);
        return 85;
    }
};

/**
 * Dynamic Self-Seeding for Trust Dashboard Metrics
 */
const seedTrustMockData = async () => {
    try {
        const count = await SellerTrust.countDocuments();
        if (count > 0) return; // Already seeded

        console.log('[TrustService] Seeding trust and fraud mock metrics for dashboard presentation...');

        const sellers = await User.find({ role: 'seller' }).limit(5);
        const customers = await User.find({ role: 'customer' }).limit(5);

        for (let i = 0; i < sellers.length; i++) {
            const seller = sellers[i];
            const trustScore = 70 + (i * 6); // 70 to 94

            await SellerTrust.create({
                sellerId: seller._id,
                trustScore,
                responseTimeScore: 75 + (i * 5),
                stockAccuracyScore: 80 + (i * 4),
                completionRateScore: 70 + (i * 6),
                verificationStatusScore: seller.verificationStatus === 'approved' ? 100 : 60,
                disputesScore: 100 - (i * 10),
                customerFeedbackScore: 80 + (i * 4),
                lastCalculated: new Date()
            });

            await RiskProfile.create({
                userId: seller._id,
                riskScore: 100 - trustScore + (i % 2 === 0 ? 15 : 0),
                riskLevel: i === 0 ? 'high' : (i < 3 ? 'medium' : 'low'),
                reasons: i === 0 ? ['Shared bank details matched', 'Low stock accuracy warnings'] : []
            });

            if (i === 0) {
                // Fraud Event
                await FraudEvent.create({
                    userId: seller._id,
                    eventType: 'duplicate_seller',
                    severity: 'high',
                    status: 'pending_moderation',
                    details: {
                        reason: 'Identical bank account details found on Indore Seller registration.',
                        matchedAccounts: [{ name: 'Shashwat Store', email: 'shashwat@aisle.com' }]
                    }
                });
            }
        }

        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            const trustScore = 80 + (i * 4); // 80 to 96

            await CustomerTrust.create({
                customerId: customer._id,
                trustScore,
                spamRequestsCount: i === 0 ? 3 : 0,
                cancellationsCount: i === 1 ? 2 : 0,
                lastCalculated: new Date()
            });

            if (i === 0) {
                await FraudEvent.create({
                    userId: customer._id,
                    eventType: 'spam_requests',
                    severity: 'medium',
                    status: 'pending_moderation',
                    details: {
                        ip: '192.168.1.42',
                        deviceId: 'aisle_dev_device_mock',
                        rate: '12 requests/min',
                        reason: 'Request rate limit triggered on Cold Coffee queries.'
                    }
                });
            }
        }

        console.log('[TrustService] Seeding mock trust data completed.');
    } catch (err) {
        console.error('[TrustService] Seeding mock trust data failed:', err.message);
    }
};

module.exports = {
    calculateSellerTrust,
    calculateCustomerTrust,
    calculateUserRiskScore,
    detectDuplicateSellers,
    detectSpamAndFraud,
    validateReviewIntegrity,
    detectPromotionAbuse,
    detectMultiAccountAbuse,
    detectReferralAbuse,
    detectReviewManipulation,
    getModerationCopilotDecision,
    calculateMarketplaceQualityScore,
    seedTrustMockData
};
