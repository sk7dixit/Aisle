const Product = require('../../models/Product');
const SellerProduct = require('../../models/SellerProduct');
const StockMovement = require('../../models/StockMovement');

/**
 * Executes or rolls back actions on Stock quantities and logs movement audit logs.
 */
const executeInventoryResolution = async (actionType, productId, sellerId, payload = {}) => {
    let product = await SellerProduct.findOne({ _id: productId, seller: sellerId });
    let isLinked = true;

    if (!product) {
        product = await Product.findOne({ _id: productId, seller: sellerId });
        isLinked = false;
    }

    if (!product) throw new Error('Product not found or access denied');

    const previousState = {
        quantity: product.quantity,
        availability: product.availability,
        stockStatus: product.stockStatus
    };

    const targetName = product.name || 'Inventory Item';

    if (actionType === 'RESTOCK_INVENTORY') {
        const prevQty = product.quantity || 0;
        product.quantity = prevQty + 10;
        product.availability = 'AVAILABLE';
        product.stockStatus = 'IN_STOCK';
        await product.save();

        await StockMovement.create({
            seller: sellerId,
            [isLinked ? 'sellerProduct' : 'product']: product._id,
            change: 10,
            reason: 'MANUAL_ADJUST',
            notes: 'Restocked +10 via Smart Guide one-click action'
        });
    }

    return { targetName, previousState };
};

const rollbackInventoryResolution = async (actionType, productId, sellerId, previousState) => {
    let product = await SellerProduct.findOne({ _id: productId, seller: sellerId });
    let isLinked = true;

    if (!product) {
        product = await Product.findOne({ _id: productId, seller: sellerId });
        isLinked = false;
    }

    if (!product) throw new Error('Product not found or access denied');

    const change = (previousState.quantity || 0) - product.quantity;

    product.quantity = previousState.quantity || 0;
    if (previousState.availability !== undefined) product.availability = previousState.availability;
    if (previousState.stockStatus !== undefined) product.stockStatus = previousState.stockStatus;
    await product.save();

    await StockMovement.create({
        seller: sellerId,
        [isLinked ? 'sellerProduct' : 'product']: product._id,
        change: change,
        reason: 'MANUAL_ADJUST',
        notes: `Rollback stock change. Restored to: ${product.quantity}`
    });

    return true;
};

module.exports = {
    executeInventoryResolution,
    rollbackInventoryResolution
};
