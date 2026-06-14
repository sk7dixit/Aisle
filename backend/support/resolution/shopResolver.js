const User = require('../../models/User');
const Shop = require('../../models/Shop');

/**
 * Executes or rolls back actions on Shop/Operating parameters.
 */
const executeShopResolution = async (actionType, sellerId) => {
    const user = await User.findById(sellerId);
    const shop = await Shop.findOne({ owner: sellerId });

    if (!user || !user.shopDetails) throw new Error('User shop details not found');

    const previousState = {
        manualOverride: user.shopDetails.manualOverride,
        isManuallyOpen: user.shopDetails.isManuallyOpen,
        isOpen: user.shopDetails.isOpen,
        autoScheduleEnabled: user.shopDetails.autoScheduleEnabled,
        holidayMode: user.shopDetails.holidayMode || false
    };

    const targetName = user.shopDetails.shopName || 'Shop Status';

    if (actionType === 'OPEN_SHOP') {
        user.shopDetails.manualOverride = true;
        user.shopDetails.isManuallyOpen = true;
        user.shopDetails.isOpen = true;
        user.shopDetails.autoScheduleEnabled = false;

        if (shop) {
            shop.isOpen = true;
            await shop.save();
        }
        await user.save();
    } else if (actionType === 'DISABLE_MANUAL_OVERRIDE') {
        user.shopDetails.manualOverride = false;
        user.shopDetails.autoScheduleEnabled = true;
        await user.save();
    } else if (actionType === 'DISABLE_HOLIDAY_MODE') {
        user.shopDetails.holidayMode = false;
        user.shopDetails.manualOverride = false;
        user.shopDetails.autoScheduleEnabled = true;
        await user.save();
    }

    return { targetName, previousState };
};

const rollbackShopResolution = async (actionType, sellerId, previousState) => {
    const user = await User.findById(sellerId);
    const shop = await Shop.findOne({ owner: sellerId });

    if (!user || !user.shopDetails) throw new Error('User shop details not found');

    if (previousState.manualOverride !== undefined) user.shopDetails.manualOverride = previousState.manualOverride;
    if (previousState.isManuallyOpen !== undefined) user.shopDetails.isManuallyOpen = previousState.isManuallyOpen;
    if (previousState.isOpen !== undefined) {
        user.shopDetails.isOpen = previousState.isOpen;
        if (shop) {
            shop.isOpen = previousState.isOpen;
            await shop.save();
        }
    }
    if (previousState.autoScheduleEnabled !== undefined) user.shopDetails.autoScheduleEnabled = previousState.autoScheduleEnabled;
    if (previousState.holidayMode !== undefined) user.shopDetails.holidayMode = previousState.holidayMode;

    await user.save();
    return true;
};

module.exports = {
    executeShopResolution,
    rollbackShopResolution
};
