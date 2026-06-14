const buildSellerContext = require('./context/contextBuilder');

/**
 * Generates a structured escalation package for admin review.
 */
const buildEscalationSummary = async (session, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(session.sellerId);
    
    // Formulate a recommended action based on findings
    let recommendedAction = 'Contact seller to resolve general account queries';
    if (session.findings.includes('Offers Disabled')) {
        recommendedAction = 'Enable promotional offers and check discount codes';
    } else if (session.findings.includes('All Products Out of Stock') || session.findings.includes('Products Out of Stock')) {
        recommendedAction = 'Restock inventory quantities for active listings';
    } else if (session.findings.includes('Bank Verification Incomplete')) {
        recommendedAction = 'Approve KYC status and verify bank routing details';
    }

    const summary = {
        sessionId: session._id,
        issue: session.issue,
        investigationCompleted: session.findings.length > 0,
        findings: session.findings,
        recommendedAction,
        metadata: session.metadata,
        sellerDetails: {
            sellerId: session.sellerId,
            shopName: context.shop?.shopName || 'Unknown Shop',
            city: context.shop?.city || 'Unknown'
        },
        evidence: {
            productsCount: context.products?.totalProducts || 0,
            outOfStockCount: context.products?.outOfStockCount || 0,
            offersCount: context.offers?.totalOffers || 0,
            bankVerified: context.payments?.bankStatus === 'VERIFIED',
            pendingAmount: context.payments?.pendingAmount || 0
        }
    };

    return summary;
};

module.exports = buildEscalationSummary;
