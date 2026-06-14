const Order = require('../../models/Order');

/**
 * Compiles aggregated order statuses, complete disputes, and completed sales values.
 */
const getOrderContext = async (sellerId) => {
    try {
        const orders = await Order.find({ sellerId }).lean();

        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
        const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'READY_FOR_PICKUP').length;
        const completedOrders = orders.filter(o => o.status === 'FULFILLED').length;
        const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

        // Sum total amount of delivered/fulfilled orders
        const completedSales = orders
            .filter(o => o.status === 'FULFILLED')
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const activeDisputes = orders.filter(o => o.dispute && o.dispute.status === 'OPEN').length;

        return {
            totalOrders,
            pendingOrders,
            confirmedOrders,
            completedOrders,
            cancelledOrders,
            completedSales,
            activeDisputes,
            list: orders.map(o => ({
                id: o._id,
                status: o.status,
                totalAmount: o.totalAmount,
                paymentMode: o.paymentMode,
                paymentStatus: o.paymentStatus,
                disputed: o.dispute?.status === 'OPEN',
                createdAt: o.createdAt
            }))
        };
    } catch (error) {
        console.error('Error in orderContext:', error);
        return {
            totalOrders: 0,
            pendingOrders: 0,
            confirmedOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            completedSales: 0,
            activeDisputes: 0,
            list: []
        };
    }
};

module.exports = getOrderContext;
