const Request = require('../models/Request');
const Product = require('../models/Product');
const SellerProduct = require('../models/SellerProduct');
const { calculateStockStatus } = require('../utils/stockUtils');
const { sendNotification, NOTIFICATION_TYPE } = require('./notificationService');

const performRequestExpiryCheck = async () => {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        console.warn(`[Job] Mongoose not connected (State: ${mongoose.connection.readyState}). Skipping.`);
        return;
    }

    try {
        const now = new Date();

        const expiredRequests = await Request.find({
            status: 'PENDING_CONFIRMATION',
            expiresAt: { $lt: now }
        });

        if (expiredRequests.length > 0) {
            console.log(`[Request Job] Processing ${expiredRequests.length} expired Soft Reservations...`);
        }

        for (const req of expiredRequests) {
            let product = await Product.findById(req.productId);
            if (!product) {
                product = await SellerProduct.findById(req.productId);
            }

            if (!product) {
                req.status = 'EXPIRED';
                await req.save();
                continue;
            }

            const status = calculateStockStatus(product);

            if (status === 'LIMITED' || status === 'OUT_OF_STOCK') {
                req.status = 'EXPIRED';
                await req.save();

                sendNotification(req.customerId, NOTIFICATION_TYPE.SYSTEM_ALERT, {
                    title: 'Reservation Expired',
                    message: `We released your reservation for ${req.productName} due to limited stock.`,
                    actionLink: `/product/${req.productId}`
                }).catch(err => console.error(err));

            } else {
                req.status = 'SYSTEM_CONFIRMED';
                req.confirmationType = 'SYSTEM';

                if (req.visitDate && req.visitTime) {
                    const Visit = require('../models/Visit');
                    const crypto = require('crypto');
                    const scheduledTime = new Date(`${req.visitDate}T${req.visitTime}`);
                    const visitToken = crypto.randomBytes(32).toString('hex');

                    await Visit.create({
                        interestRequestId: req._id,
                        shopId: req.sellerId,
                        customerId: req.customerId,
                        visitType: req.paymentMethod === 'PAY_NOW' ? 'PAID_ONLINE_PICKUP' : 'PAY_ON_VISIT',
                        scheduledTime: !isNaN(scheduledTime) ? scheduledTime : new Date(),
                        status: 'UPCOMING',
                        productName: req.productName,
                        customerName: req.customerName,
                        visitToken,
                        visitTokenExpiresAt: new Date(scheduledTime.getTime() + 24 * 60 * 60 * 1000)
                    });
                }

                await req.save();
            }
        }

    } catch (error) {
        console.error("[Request Job Error] Request Scheduler Error:", error);
        throw error;
    }
};

const runRequestScheduler = () => {
    if (process.env.DISABLE_SCHEDULERS === 'true' || process.env.NODE_ENV === 'production') {
        console.log('[Request Scheduler] Running via background workers.');
        return;
    }

    console.log("Starting Request Scheduler (Interval mode)...");
    setInterval(async () => {
        await performRequestExpiryCheck();
    }, 10000);
};

module.exports = runRequestScheduler;
module.exports.performRequestExpiryCheck = performRequestExpiryCheck;
