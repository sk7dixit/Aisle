const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { SUBSCRIPTION_PLANS, VISIBILITY_BOOST } = require('../config/subscriptionConfig');
const { createNotification } = require('./notificationController');
const crypto = require('crypto');

// @desc    Create Payment Order
// @route   POST /api/payment/create-order
// @access  Private (Seller)
const createOrder = async (req, res) => {
    try {
        const { type, planId, duration, boostDuration } = req.body;
        const sellerId = req.user._id;

        let amount = 0;
        let discount = 0;
        let finalPrice = 0;

        // 1. Calculate Price based on Type
        if (type === 'SUBSCRIPTION') {
            const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
            if (!plan) return res.status(400).json({ message: "Invalid Plan" });

            let basePrice = plan.priceMonthly;
            let originalPrice = basePrice;

            // Replicate Frontend/Preview Logic
            if (duration === '6months') {
                originalPrice = basePrice * 6;
                finalPrice = Math.round(originalPrice * 0.85); // 15% off
                discount = originalPrice - finalPrice;
            } else if (duration === '12months') {
                originalPrice = basePrice * 12;
                finalPrice = Math.round(originalPrice * 0.70); // 30% off
                discount = originalPrice - finalPrice;
            } else {
                finalPrice = basePrice;
                discount = 0;
            }
        } else if (type === 'BOOST') {
            const boostConfig = Object.values(VISIBILITY_BOOST).find(b => b.durationHours === boostDuration * 24);
            if (!boostConfig) return res.status(400).json({ message: "Invalid Boost Duration" });
            finalPrice = boostConfig.price;
        } else {
            return res.status(400).json({ message: "Invalid Transaction Type" });
        }

        // Add Tax (Simulation)
        const tax = Math.round(finalPrice * 0.18);
        const totalPaid = finalPrice + tax;

        // 2. Create Pending Transaction
        const transactionId = `ORDER_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const transaction = await Transaction.create({
            sellerId,
            type,
            planId: type === 'SUBSCRIPTION' ? planId : undefined,
            duration: type === 'SUBSCRIPTION' ? duration : undefined,
            boostDuration: type === 'BOOST' ? boostDuration : undefined,
            amount: finalPrice,
            discount,
            totalPaid,
            currency: 'INR',
            status: 'PENDING',
            transactionId
        });

        res.status(201).json({
            transactionId: transaction.transactionId,
            amount: transaction.totalPaid,
            currency: 'INR',
            orderId: transaction._id, // Internal Ref
            // Mock Gateway Data to simulate production flow
            upiIntentUrl: `upi://pay?pa=aisle@bank&pn=Aisle&tr=${transactionId}&tn=${type === 'SUBSCRIPTION' ? 'Plan Upgrade' : 'Boost'}&am=${totalPaid}&cu=INR`,
            qrCode: "VALID_QR_CODE_BASE64_PLACEHOLDER"
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
};

// @desc    Verify Payment & Activate
// @route   POST /api/payment/verify
// @access  Private (Seller)
const verifyPayment = async (req, res) => {
    try {
        const { transactionId, paymentMethod } = req.body;
        const sellerId = req.user._id;

        const transaction = await Transaction.findOne({ transactionId, sellerId });
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });

        if (transaction.status === 'SUCCESS') {
            return res.status(200).json({ message: "Already activated" });
        }

        // 1. Mark Transaction Success
        transaction.status = 'SUCCESS';
        transaction.paymentMethod = paymentMethod || 'UPI';
        await transaction.save();

        // 2. Activate Subscription / Boost
        const user = await User.findById(sellerId);

        if (transaction.type === 'SUBSCRIPTION') {
            const startDate = new Date();
            let endDate = new Date(startDate);

            // Calculate End Date
            if (transaction.duration === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            else if (transaction.duration === '6months') endDate.setMonth(endDate.getMonth() + 6);
            else if (transaction.duration === '12months') endDate.setMonth(endDate.getMonth() + 12);

            // ATOMIC ACTIVATION: Overwrite previous plan
            user.subscription = {
                planId: transaction.planId,
                isActive: true,
                startDate: startDate,
                endDate: endDate
            };

            // Unlock Features (if Pro) - In a real app this might trigger other flags
            // For now, planId determines limits dynamically.

            await createNotification(
                sellerId,
                'SYSTEM',
                '🎉 Subscription Activated',
                `Your ${transaction.planId.charAt(0).toUpperCase() + transaction.planId.slice(1)} Plan is now active. Enjoy higher visibility and exclusive insights.`,
                'HIGH'
            );

        } else if (transaction.type === 'BOOST') {
            const startDate = new Date();
            const endDate = new Date(startDate);
            // find boost config for duration
            const boostConfig = Object.values(VISIBILITY_BOOST).find(b => b.durationHours === (transaction.boostDuration || 1) * 24);

            endDate.setHours(endDate.getHours() + (boostConfig?.durationHours || 24));

            user.visibilityBoost = {
                isActive: true,
                boostType: boostConfig?.type?.toUpperCase() || 'DAILY',
                startDate: startDate,
                endDate: endDate
            };

            await createNotification(
                sellerId,
                'SYSTEM',
                'Boost Activated! 🚀',
                `Your shop visibility is boosted for ${transaction.boostDuration} days.`,
                'MEDIUM'
            );
        }

        await user.save();

        res.status(200).json({ success: true, message: "Activated successfully" });

    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
};

module.exports = {
    createOrder,
    verifyPayment
};
