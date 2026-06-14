const getAccountContext = require('./accountContext');
const getShopContext = require('./shopContext');
const getProductContext = require('./productContext');
const getOrderContext = require('./orderContext');
const getPaymentContext = require('./paymentContext');
const getOfferContext = require('./offerContext');

/**
 * Orchestrates compiling account, shop, product, order, payment, and offer sub-contexts in parallel.
 * @param {string} sellerId 
 */
const buildSellerContext = async (sellerId) => {
    try {
        const [account, shop, products, orders, payments, offers] = await Promise.all([
            getAccountContext(sellerId),
            getShopContext(sellerId),
            getProductContext(sellerId),
            getOrderContext(sellerId),
            getPaymentContext(sellerId),
            getOfferContext(sellerId)
        ]);

        return {
            sellerId,
            account,
            shop,
            products,
            orders,
            payments,
            offers
        };
    } catch (error) {
        console.error('Error in buildSellerContext:', error);
        return {
            sellerId,
            error: error.message
        };
    }
};

module.exports = buildSellerContext;
