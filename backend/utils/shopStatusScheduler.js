const User = require('../models/User');
const Product = require('../models/Product');
const { deriveShopStatus } = require('./shopStatusUtils');

const syncShopStatus = async () => {
    try {
        console.log('[ShopStatusScheduler] Starting sync for all sellers...');
        const sellers = await User.find({ role: 'seller' });
        
        let updateCount = 0;

        for (const seller of sellers) {
            if (!seller.shopDetails) continue;

            const isCurrentlyOpen = deriveShopStatus(seller.shopDetails) === 'ONLINE';
            const wasOpen = seller.shopDetails.isOpen || false;

            if (isCurrentlyOpen !== wasOpen) {
                // Update User model
                seller.shopDetails.isOpen = isCurrentlyOpen;
                await seller.save();

                // Update all seller products in bulk
                await Product.updateMany(
                    { seller: seller._id },
                    { isOpen: isCurrentlyOpen }
                );

                console.log(`[ShopStatusScheduler] Updated seller ${seller.shopDetails.shopName || seller._id} open status: ${wasOpen} -> ${isCurrentlyOpen}`);
                updateCount++;
            }
        }

        console.log(`[ShopStatusScheduler] Finished sync. Updated ${updateCount} sellers.`);
    } catch (error) {
        console.error('[ShopStatusScheduler] Error during shop status sync:', error.message);
    }
};

module.exports = { syncShopStatus };
