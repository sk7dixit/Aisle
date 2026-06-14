const Shop = require('../../models/Shop');
const User = require('../../models/User');
const { deriveShopStatus } = require('../../utils/shopStatusUtils');

/**
 * Compiles shop details, operating hours, schedule overrides and status.
 */
const getShopContext = async (sellerId) => {
    try {
        const shop = await Shop.findOne({ owner: sellerId }).lean();
        const user = await User.findById(sellerId).lean();
        
        const shopDetails = user?.shopDetails || {};
        const derivedStatus = shopDetails ? deriveShopStatus(shopDetails) : 'OFFLINE';

        return {
            shopId: shop?._id || null,
            shopName: shop?.shopName || shopDetails.shopName || 'Unknown Shop',
            isOpen: shop?.isOpen ?? shopDetails.isOpen ?? false,
            derivedStatus, // ONLINE or OFFLINE
            operatingMode: shopDetails.operatingMode || 'GUARANTEED',
            manualOverride: shopDetails.manualOverride || false,
            isManuallyOpen: shopDetails.isManuallyOpen || false,
            autoScheduleEnabled: shopDetails.autoScheduleEnabled ?? true,
            openingTime: shopDetails.openingTime || '09:00',
            closingTime: shopDetails.closingTime || '20:00',
            category: shop?.category || shopDetails.category || 'General',
            shopType: require('./businessContext').getNormalizedShopType(shopDetails.shopType || 'GROCERY_KIRANA'),
            hasLocation: !!(shopDetails.location?.lat && shopDetails.location?.lng),
            lat: shopDetails.location?.lat || null,
            lng: shopDetails.location?.lng || null
        };
    } catch (error) {
        console.error('Error in shopContext:', error);
        return {
            shopName: 'Unknown Shop',
            isOpen: false,
            derivedStatus: 'OFFLINE',
            operatingMode: 'GUARANTEED',
            manualOverride: false,
            isManuallyOpen: false,
            openingTime: '09:00',
            closingTime: '20:00',
            error: error.message
        };
    }
};

module.exports = getShopContext;
