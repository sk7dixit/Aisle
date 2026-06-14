class GroceryRules {
    getTrendingProducts() {
        return [
            { id: 1, name: "Organic Honey", searches: 146, trend: "UP" },
            { id: 2, name: "Brown Bread", searches: 92, trend: "UP" },
            { id: 3, name: "Fresh Paneer", searches: 88, trend: "UP" },
            { id: 4, name: "Fresh Curd", searches: 64, trend: "STABLE" }
        ];
    }

    getSearchGaps() {
        return [
            { name: 'Brown Bread', searches: 146, estimatedRevenue: 4800, category: 'Grocery' },
            { name: 'Organic Honey', searches: 92, estimatedRevenue: 3400, category: 'Grocery' },
            { name: 'Fresh Paneer', searches: 80, estimatedRevenue: 2200, category: 'Grocery' }
        ];
    }

    getBaseDemand(productName, quantity) {
        const name = (productName || '').toLowerCase();
        if (name.includes('milk')) return 40;
        if (name.includes('bread')) return 25;
        if (name.includes('paneer')) return 15;
        return Math.max(5, Math.round((quantity || 0) * 0.4));
    }

    getDefaultForecasts() {
        return [
            {
                productName: 'Organic Milk',
                currentStock: 25,
                predictedDemand: 58,
                recommendedStock: 60,
                confidence: 90
            }
        ];
    }

    getCustomTasks(context) {
        // Standard physical inventory tasks
        return [];
    }

    getCopilotAdvice(text) {
        let reply = "Hello! I am your Aisle Commerce Copilot. I analyze your grocery catalog, transactions, and customer metrics to advise you on growing your grocery store.";
        let actions = [
            "Complete your store banner to enhance page visibility.",
            "Verify your payment accounts to ensure regular payouts."
        ];
        let estimatedRevenueIncrease = 3000;

        if (['earn', 'more', 'increase', 'sales', 'growth', 'grow', 'revenue', 'boost', 'month', 'this month'].some(w => text.includes(w))) {
            reply = "I completed an grocery operations audit for your shop. Here is your Potential Growth Plan to increase earnings this month:";
            actions = [
                "Add Organic Honey (High local search gap: 92 queries, +₹3,400/mo potential)",
                "Enable Weekend discount combo offers (+₹4,500/mo potential)",
                "Restock Organic Milk to prevent search traffic dropouts (+₹1,200/mo potential)",
                "Upload clear cover photos to listings missing images to boost click rates (+₹1,800/mo potential)"
            ];
            estimatedRevenueIncrease = 6500;
        } else if (['stock', 'inventory', 'milk', 'bread', 'paneer'].some(w => text.includes(w))) {
            reply = "I reviewed your grocery product inventory. Here is your supply chain recommendation:";
            actions = [
                "Increase Organic Milk stock levels to 60 units (expected weekend demand spike: 58 units)",
                "Replenish Bread and Paneer units before Thursday local customer peaks"
            ];
            estimatedRevenueIncrease = 2400;
        } else if (['payout', 'bank', 'kyc', 'money', 'payment'].some(w => text.includes(w))) {
            reply = "Regarding your grocery cash settlements, here is the required action:";
            actions = [
                "Submit your bank verification form to release your pending weekly payout balance."
            ];
            estimatedRevenueIncrease = 0;
        }

        return { reply, actions, estimatedRevenueIncrease };
    }

    getAIPromptContext() {
        return {
            shopType: "GROCERY_KIRANA",
            businessCategory: "Grocery & Provisions"
        };
    }
}

module.exports = GroceryRules;
