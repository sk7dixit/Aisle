class HomeBusinessRules {
    getTrendingProducts() {
        return [
            { id: 1, name: "Homemade Pickles", searches: 130, trend: "UP" },
            { id: 2, name: "Bakery Products", searches: 98, trend: "UP" },
            { id: 3, name: "Daily Tiffin Plans", searches: 85, trend: "STABLE" },
            { id: 4, name: "Handmade Gift Hampers", searches: 62, trend: "UP" }
        ];
    }

    getSearchGaps() {
        return [
            { name: 'Sourdough Bread (Fresh)', searches: 125, estimatedRevenue: 3400, category: 'Home Business' },
            { name: 'Mango Pickle Jar (Organic)', searches: 88, estimatedRevenue: 2200, category: 'Home Business' },
            { name: 'Weekly Lunch Tiffin Plan', searches: 75, estimatedRevenue: 4500, category: 'Home Business' }
        ];
    }

    getBaseDemand(productName, quantity) {
        const name = (productName || '').toLowerCase();
        if (name.includes('tiffin') || name.includes('meal')) return 25;
        if (name.includes('pickle') || name.includes('jar')) return 10;
        if (name.includes('bread') || name.includes('cake')) return 15;
        return Math.max(3, Math.round((quantity || 0) * 0.45));
    }

    getDefaultForecasts() {
        return [
            {
                productName: 'Daily Lunch Tiffin Plan',
                currentStock: 15,
                predictedDemand: 32,
                recommendedStock: 35,
                confidence: 90
            }
        ];
    }

    getCustomTasks(context) {
        return [
            {
                task: "Schedule baking/tiffin delivery batches for tomorrow",
                priority: "MEDIUM",
                action: "BATCH_SCHEDULE"
            }
        ];
    }

    getCopilotAdvice(text) {
        let reply = "Hello! I am your Aisle Home Business Advisor. I analyze your batch order logs, recipes demand, and catering/delivery preferences to help grow your home-based business.";
        let actions = [
            "Complete your home-cooked hygiene certification upload.",
            "Verify your bank KYC preferences to receive weekly settlements."
        ];
        let estimatedRevenueIncrease = 2800;

        if (['earn', 'more', 'increase', 'sales', 'growth', 'grow', 'revenue', 'boost', 'month', 'this month'].some(w => text.includes(w))) {
            reply = "I completed a home catalog optimization checklist. Here is your Growth Plan:";
            actions = [
                "Launch Sourdough Bread orders (High demand gap: 125 queries, +₹3,400/mo potential)",
                "Offer a Monthly Tiffin Combo Deal (5% off prepayments) (+₹4,500/mo potential)",
                "Restock Mango Pickle ingredients prior to seasonal spikes (+₹2,200/mo potential)"
            ];
            estimatedRevenueIncrease = 10100;
        } else if (['stock', 'inventory', 'flour', 'spices', 'raw', 'ingredients'].some(w => text.includes(w))) {
            reply = "I reviewed your raw ingredient levels. Here is our supply chain advisory:";
            actions = [
                "Replenish tiffin prep containers (expected demand lift)",
                "Verify stock levels of specialty baking yeast (running low)"
            ];
            estimatedRevenueIncrease = 1800;
        } else if (['payout', 'bank', 'kyc', 'money', 'payment'].some(w => text.includes(w))) {
            reply = "Regarding payments and settlements for your home orders:";
            actions = [
                "Submit bank verification setup to clear your weekly payout balances."
            ];
            estimatedRevenueIncrease = 0;
        }

        return { reply, actions, estimatedRevenueIncrease };
    }

    getAIPromptContext() {
        return {
            shopType: "HOME_BUSINESS",
            businessCategory: "Home Businesses & Catering"
        };
    }
}

module.exports = HomeBusinessRules;
