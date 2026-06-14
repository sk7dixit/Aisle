const Offer = require('../../models/Offer');

/**
 * Compiles discount status, dates, active campaigns, and expired ranges.
 */
const getOfferContext = async (sellerId) => {
    try {
        const offers = await Offer.find({ sellerId }).lean();
        const activeOffers = offers.filter(o => o.status === 'Active').length;

        return {
            totalOffers: offers.length,
            activeOffers,
            list: offers.map(o => {
                const now = new Date();
                const isExpired = o.validUntil ? new Date(o.validUntil) < now : false;
                
                return {
                    id: o._id,
                    title: o.title,
                    type: o.type,
                    value: o.value,
                    match: o.match,
                    status: o.status,
                    validFrom: o.validFrom,
                    validUntil: o.validUntil,
                    isExpired
                };
            })
        };
    } catch (error) {
        console.error('Error in offerContext:', error);
        return {
            totalOffers: 0,
            activeOffers: 0,
            list: []
        };
    }
};

module.exports = getOfferContext;
