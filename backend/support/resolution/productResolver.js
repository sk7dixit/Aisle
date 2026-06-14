const Product = require('../../models/Product');
const SellerProduct = require('../../models/SellerProduct');

/**
 * Executes or rolls back actions on Product/Catalog entities.
 */
const executeProductResolution = async (actionType, productId, sellerId, payload = {}) => {
    let product = await SellerProduct.findOne({ _id: productId, seller: sellerId });
    let isLinked = true;

    if (!product) {
        product = await Product.findOne({ _id: productId, seller: sellerId });
        isLinked = false;
    }

    if (!product) throw new Error('Product not found or access denied');

    const previousState = {
        availability: product.availability,
        is_active: isLinked ? product.is_active : product.isAvailable,
        quantity: product.quantity,
        category: product.category,
        subCategory: product.subCategory
    };

    let targetName = product.name || 'Product';

    if (actionType === 'ACTIVATE_PRODUCT') {
        product.availability = 'AVAILABLE';
        if (isLinked) {
            product.is_active = true;
        } else {
            product.isAvailable = true;
        }
        await product.save();
    } else if (actionType === 'SET_PRODUCT_CATEGORY') {
        if (payload.category) product.category = payload.category;
        if (payload.subCategory) product.subCategory = payload.subCategory;
        await product.save();
    }

    return { targetName, previousState };
};

const rollbackProductResolution = async (actionType, productId, sellerId, previousState) => {
    let product = await SellerProduct.findOne({ _id: productId, seller: sellerId });
    let isLinked = true;

    if (!product) {
        product = await Product.findOne({ _id: productId, seller: sellerId });
        isLinked = false;
    }

    if (!product) throw new Error('Product not found or access denied');

    if (previousState.availability !== undefined) product.availability = previousState.availability;
    if (previousState.is_active !== undefined) {
        if (isLinked) {
            product.is_active = previousState.is_active;
        } else {
            product.isAvailable = previousState.is_active;
        }
    }
    if (previousState.quantity !== undefined) product.quantity = previousState.quantity;
    if (previousState.category !== undefined) product.category = previousState.category;
    if (previousState.subCategory !== undefined) product.subCategory = previousState.subCategory;

    await product.save();
    return true;
};

module.exports = {
    executeProductResolution,
    rollbackProductResolution
};
