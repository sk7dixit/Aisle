const Offer = require('../../models/Offer');

/**
 * Executes or rolls back actions on Offer/Promotion entities.
 */
const executeOfferResolution = async (actionType, offerId, sellerId, payload = {}) => {
    const offer = await Offer.findOne({ _id: offerId, sellerId });
    if (!offer) throw new Error('Offer not found or access denied');

    const previousState = {
        status: offer.status,
        validUntil: offer.validUntil
    };

    const targetName = offer.title || 'Offer';

    if (actionType === 'ENABLE_OFFER') {
        offer.status = 'Active';
        await offer.save();
    } else if (actionType === 'EXTEND_OFFER') {
        const days = Number(payload.days) || 7;
        const currentValidUntil = offer.validUntil ? new Date(offer.validUntil) : new Date();
        const baseDate = currentValidUntil < new Date() ? new Date() : currentValidUntil;
        baseDate.setDate(baseDate.getDate() + days);
        offer.validUntil = baseDate;
        offer.status = 'Active';
        await offer.save();
    }

    return { targetName, previousState };
};

const rollbackOfferResolution = async (actionType, offerId, sellerId, previousState) => {
    const offer = await Offer.findOne({ _id: offerId, sellerId });
    if (!offer) throw new Error('Offer not found or access denied');

    if (previousState.status !== undefined) offer.status = previousState.status;
    if (previousState.validUntil !== undefined) offer.validUntil = previousState.validUntil ? new Date(previousState.validUntil) : null;

    await offer.save();
    return true;
};

module.exports = {
    executeOfferResolution,
    rollbackOfferResolution
};
