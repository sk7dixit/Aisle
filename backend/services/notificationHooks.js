const { sendNotification, NOTIFICATION_TYPE } = require('./notificationService');

/**
 * Hook to handle stock status changes and trigger alerts
 * @param {string} sellerId 
 * @param {string} productName 
 * @param {string} entityId (e.g. productId)
 * @param {number} oldQty 
 * @param {number} newQty 
 * @param {number} lowStockThreshold 
 */
const handleStockStatusChange = async (sellerId, productName, entityId, oldQty, newQty, lowStockThreshold) => {
    try {
        const wasInStock = oldQty > 0;
        const wasAboveThreshold = oldQty > lowStockThreshold;

        const isInStock = newQty > 0;
        const isAboveThreshold = newQty > lowStockThreshold;

        // 1. Check for OUT OF STOCK Alert
        if (wasInStock && !isInStock) {
            console.log(`[Notification Hook] Stock Out detected for ${productName}`);
            await sendNotification(sellerId, NOTIFICATION_TYPE.SYSTEM_STOCK_OUT_ALERT, {
                productName,
                entityId
            });
            return;
        }

        // 2. Check for LIMITED STOCK Alert
        // Trigger if it just crossed the threshold downwards
        if (wasAboveThreshold && !isAboveThreshold && isInStock) {
            console.log(`[Notification Hook] Low Stock detected for ${productName}`);
            await sendNotification(sellerId, NOTIFICATION_TYPE.SYSTEM_STOCK_LIMITED_ALERT, {
                productName,
                quantity: newQty,
                entityId
            });
        }
    } catch (error) {
        console.error('Error in handleStockStatusChange hook:', error);
    }
};

module.exports = { handleStockStatusChange };
