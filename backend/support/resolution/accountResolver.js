const User = require('../../models/User');

/**
 * Executes or rolls back actions on Seller Account parameters.
 */
const executeAccountResolution = async (actionType, sellerId) => {
    const user = await User.findById(sellerId);
    if (!user) throw new Error('Seller account not found');

    const previousState = {
        phone: user.phone,
        verificationStatus: user.verificationStatus
    };

    const targetName = 'Seller Account Security';

    if (actionType === 'VERIFY_PHONE') {
        if (!user.phone) {
            user.phone = '9876543210';
        }
        await user.save();
    }

    return { targetName, previousState };
};

const rollbackAccountResolution = async (actionType, sellerId, previousState) => {
    const user = await User.findById(sellerId);
    if (!user) throw new Error('Seller account not found');

    if (previousState.phone !== undefined) user.phone = previousState.phone;
    if (previousState.verificationStatus !== undefined) user.verificationStatus = previousState.verificationStatus;
    await user.save();
    return true;
};

module.exports = {
    executeAccountResolution,
    rollbackAccountResolution
};
