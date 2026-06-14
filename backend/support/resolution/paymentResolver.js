const SellerAccountDetails = require('../../models/SellerAccountDetails');
const User = require('../../models/User');

/**
 * Executes or rolls back actions on Payment Settings/Bank Details.
 */
const executePaymentResolution = async (actionType, sellerId) => {
    let details = await SellerAccountDetails.findOne({ sellerId });
    const user = await User.findById(sellerId);

    if (!details) {
        details = new SellerAccountDetails({ sellerId });
    }

    const previousState = {
        paymentSetupCompleted: details.paymentSetupCompleted,
        acceptsOnlinePayment: details.acceptsOnlinePayment,
        upiId: details.upiId,
        paymentMethod: details.paymentMethod,
        userPaymentSetupCompleted: user?.shopDetails?.paymentSetupCompleted
    };

    const targetName = 'Bank Verification Setup';

    if (actionType === 'COMPLETE_PAYMENT_SETUP') {
        details.paymentSetupCompleted = true;
        details.acceptsOnlinePayment = true;
        details.paymentMethod = 'UPI';
        if (!details.upiId) {
            details.upiId = 'verified.seller@okaxis';
        }
        await details.save();

        if (user && user.shopDetails) {
            user.shopDetails.paymentSetupCompleted = true;
            user.shopDetails.acceptsOnlinePayment = true;
            await user.save();
        }
    }

    return { targetName, previousState };
};

const rollbackPaymentResolution = async (actionType, sellerId, previousState) => {
    const details = await SellerAccountDetails.findOne({ sellerId });
    const user = await User.findById(sellerId);

    if (!details) throw new Error('Payment settings not found');

    if (previousState.paymentSetupCompleted !== undefined) details.paymentSetupCompleted = previousState.paymentSetupCompleted;
    if (previousState.acceptsOnlinePayment !== undefined) details.acceptsOnlinePayment = previousState.acceptsOnlinePayment;
    if (previousState.upiId !== undefined) details.upiId = previousState.upiId;
    if (previousState.paymentMethod !== undefined) details.paymentMethod = previousState.paymentMethod;
    await details.save();

    if (user && user.shopDetails && previousState.userPaymentSetupCompleted !== undefined) {
        user.shopDetails.paymentSetupCompleted = previousState.userPaymentSetupCompleted;
        user.shopDetails.acceptsOnlinePayment = previousState.acceptsOnlinePayment || false;
        await user.save();
    }
    return true;
};

module.exports = {
    executePaymentResolution,
    rollbackPaymentResolution
};
