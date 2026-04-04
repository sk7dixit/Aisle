const SellerAccountDetails = require('../models/SellerAccountDetails');
const { decrypt } = require('../utils/encryption');

/**
 * @desc    Get Seller Payment Settings
 * @route   GET /api/seller/payment-settings
 * @access  Private (Seller)
 */
const getPaymentSettings = async (req, res) => {
    try {
        let settings = await SellerAccountDetails.findOne({ sellerId: req.user._id });

        // Migration Check: If no dedicated record, check User model for legacy data
        if (!settings && req.user.shopDetails) {
            const legacy = req.user.shopDetails;

            // Only migrate if at least the setup was completed or preference was set
            if (legacy.paymentSetupCompleted !== undefined || legacy.acceptsOnlinePayment !== undefined) {
                settings = await SellerAccountDetails.create({
                    sellerId: req.user._id,
                    acceptsOnlinePayment: legacy.acceptsOnlinePayment || false,
                    paymentMethod: legacy.paymentMethod || (legacy.upiId ? 'UPI' : null),
                    upiId: legacy.upiId || null, // Model's setter will encrypt this
                    paymentDisplayName: legacy.paymentDisplayName || legacy.shopName,
                    paymentSetupCompleted: legacy.paymentSetupCompleted || false
                });
                console.log(`Migrated payment settings for seller ${req.user._id}`);
            }
        }

        // Default if still no settings
        if (!settings) {
            return res.json({
                success: true,
                settings: {
                    acceptsOnlinePayment: false,
                    paymentSetupCompleted: false,
                    paymentMethod: null,
                    upiId: null,
                    displayName: null
                }
            });
        }

        // Return settings with MASKED UPI ID (Safe for frontend)
        res.json({
            success: true,
            settings: {
                acceptsOnlinePayment: settings.acceptsOnlinePayment,
                paymentMethod: settings.paymentMethod,
                upiId: settings.maskedUpiId, // Uses the virtual we defined
                displayName: settings.paymentDisplayName,
                paymentSetupCompleted: settings.paymentSetupCompleted
            }
        });
    } catch (error) {
        console.error('Get Payment Settings Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Save/Update Payment Settings
 * @route   POST /api/seller/payment-settings (Initial) or PUT /api/seller/payment-settings (Edit)
 * @access  Private (Seller)
 */
const savePaymentSettings = async (req, res) => {
    try {
        const { acceptsOnlinePayment, upiId, paymentDisplayName, paymentSetupCompleted } = req.body;

        let settings = await SellerAccountDetails.findOne({ sellerId: req.user._id });

        if (!settings) {
            settings = new SellerAccountDetails({ sellerId: req.user._id });
        }

        if (acceptsOnlinePayment !== undefined) settings.acceptsOnlinePayment = acceptsOnlinePayment;
        if (paymentSetupCompleted !== undefined) settings.paymentSetupCompleted = paymentSetupCompleted;
        if (paymentDisplayName !== undefined) settings.paymentDisplayName = paymentDisplayName;

        // Logical rule: If allows online, upiId is required. If not, upiId is null.
        if (acceptsOnlinePayment === true) {
            if (upiId) {
                settings.upiId = upiId; // Setter encrypts it
                settings.paymentMethod = 'UPI';
            }
        } else if (acceptsOnlinePayment === false) {
            settings.upiId = null;
            settings.paymentMethod = null;
        }

        await settings.save();

        // Also update the flag on User model for backward compatibility with dashboard modules if needed
        // but the core logic should shift to checking this new model.
        if (req.user.shopDetails) {
            req.user.shopDetails.paymentSetupCompleted = settings.paymentSetupCompleted;
            req.user.shopDetails.acceptsOnlinePayment = settings.acceptsOnlinePayment;
            await req.user.save();
        }

        res.json({
            success: true,
            settings: {
                acceptsOnlinePayment: settings.acceptsOnlinePayment,
                paymentMethod: settings.paymentMethod,
                upiId: settings.maskedUpiId,
                displayName: settings.paymentDisplayName,
                paymentSetupCompleted: settings.paymentSetupCompleted
            }
        });
    } catch (error) {
        console.error('Save Payment Settings Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Get Seller Payment Details (Read-only)
 * @route   GET /api/admin/seller-payment-details/:sellerId
 * @access  Private (Admin)
 */
const adminGetSellerPaymentDetails = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const settings = await SellerAccountDetails.findOne({ sellerId });

        if (!settings) {
            return res.status(404).json({ message: 'Payment settings not found' });
        }

        // Admin strictly sees masked data too (security first)
        res.json({
            success: true,
            settings: {
                acceptsOnlinePayment: settings.acceptsOnlinePayment,
                paymentMethod: settings.paymentMethod,
                upiId: settings.maskedUpiId,
                displayName: settings.paymentDisplayName,
                paymentSetupCompleted: settings.paymentSetupCompleted,
                lastUpdated: settings.updatedAt
            }
        });
    } catch (error) {
        console.error('Admin Fetch Payment Details Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getPaymentSettings,
    savePaymentSettings,
    adminGetSellerPaymentDetails
};
