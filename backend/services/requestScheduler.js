const Request = require('../models/Request');
const Product = require('../models/Product');
const SellerProduct = require('../models/SellerProduct');
const { calculateStockStatus } = require('../utils/stockUtils');
const { sendNotification, NOTIFICATION_TYPE } = require('./notificationService');

const runRequestScheduler = () => {
    console.log("Starting Request Scheduler...");

    // Run every 10 seconds
    setInterval(async () => {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            console.warn(`[Scheduler] Mongoose not connected (State: ${mongoose.connection.readyState}). Skipping.`);
            return;
        }

        try {
            const now = new Date();

            // Find all PENDING_CONFIRMATION requests that have expired
            const expiredRequests = await Request.find({
                status: 'PENDING_CONFIRMATION',
                expiresAt: { $lt: now }
            });

            if (expiredRequests.length > 0) {
                console.log(`Processing ${expiredRequests.length} expired Soft Reservations...`);
            }

            for (const req of expiredRequests) {
                // Determine Stock Status (Limited vs Available)
                let product = await Product.findById(req.productId);
                if (!product) {
                    product = await SellerProduct.findById(req.productId);
                }

                if (!product) {
                    // Product deleted? Mark request expired safely.
                    req.status = 'EXPIRED';
                    await req.save();
                    continue;
                }

                // Check Stock Status
                const status = calculateStockStatus(product);

                if (status === 'LIMITED' || status === 'OUT_OF_STOCK') {
                    // RULE: Limited Stock -> EXPIRE
                    req.status = 'EXPIRED';
                    await req.save();

                    // Notify Customer
                    sendNotification(req.customerId, NOTIFICATION_TYPE.SYSTEM_ALERT, {
                        title: 'Reservation Expired',
                        message: `We released your reservation for ${req.productName} due to limited stock.`,
                        actionLink: `/product/${req.productId}`
                    }).catch(err => console.error(err));

                } else {
                    // RULE: Available -> AUTO CONFIRM (System)
                    req.status = 'SYSTEM_CONFIRMED';
                    req.confirmationType = 'SYSTEM';

                    // Create Visit if applicable
                    if (req.visitDate && req.visitTime) {
                        const Visit = require('../models/Visit'); // Lazy load
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
            console.error("Request Scheduler Error:", error);
        }
    }, 10000); // 10 Seconds
};

module.exports = runRequestScheduler;
