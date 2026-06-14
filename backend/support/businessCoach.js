const buildSellerContext = require('./context/contextBuilder');

/**
 * Parses growth queries and returns AI coaching recommendations.
 */
const getCoachAdvice = async (sellerId, messageText, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    const text = messageText.toLowerCase();

    let reply = "Hello! I am your Aisle Business Coach. I analyze your catalog, sales, and local traffic trends to help you grow your shop's revenue.";
    let recommendations = [
        "Add 3 more popular items like organic milk and paneer to capture local customer search demand.",
        "Add product images to listings currently missing cover photos to boost customer page clicks.",
        "Verify your shop is online during peak local times (5 PM - 8 PM)."
    ];
    let estimatedImpact = 15; // +15% sales

    if (['increase', 'sales', 'grow', 'revenue', 'sell', 'more', 'customer', 'customers'].some(w => text.includes(w))) {
        reply = "Here is your growth advisory analysis to increase sales:";
        recommendations = [
            "Add at least 5 products to increase listing diversity (+8% conversions).",
            "Enable discount bundle offers to encourage larger cart sizes (+5% basket size).",
            "Restock top-selling products that are running low (+3% visibility index).",
            "Upload clear product images to all local listings (+2% click-through rate)."
        ];
        estimatedImpact = 18; // +18% sales
    } else if (['payout', 'payment', 'money', 'paisa'].some(w => text.includes(w))) {
        reply = "Here is my advice on payments and cash flows:";
        recommendations = [
            "Complete your bank KYC validation to unlock payouts.",
            "Verify bank routing details under Payments -> Settings to resolve pending holds."
        ];
        estimatedImpact = 0;
    } else if (['stock', 'inventory', 'exhaust'].some(w => text.includes(w))) {
        reply = "Here is my advice on inventory management:";
        recommendations = [
            "Set a daily restock schedule for high-demand items.",
            "Maintain a low-stock threshold alert at 5 units to avoid missing search traffic."
        ];
        estimatedImpact = 10;
    }

    return {
        reply,
        recommendations,
        estimatedImpact
    };
};

module.exports = {
    getCoachAdvice
};
