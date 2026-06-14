class ElectronicsRules {
    getTrendingProducts() {
        return [
            { id: 1, name: "USB Cable", searches: 155, trend: "UP" },
            { id: 2, name: "Extension Board", searches: 110, trend: "UP" },
            { id: 3, name: "Power Bank 10000mAh", searches: 98, trend: "UP" },
            { id: 4, name: "Bluetooth Speaker", searches: 64, trend: "STABLE" }
        ];
    }

    getSearchGaps() {
        return [
            { name: 'USB-C Fast Charger', searches: 140, estimatedRevenue: 3800, category: 'Electronics' },
            { name: 'Wireless Mouse', searches: 95, estimatedRevenue: 2700, category: 'Electronics' },
            { name: 'Smart LED Bulb', searches: 80, estimatedRevenue: 1900, category: 'Electronics' }
        ];
    }

    getBaseDemand(productName, quantity) {
        const name = (productName || '').toLowerCase();
        if (name.includes('cable') || name.includes('usb')) return 30;
        if (name.includes('charger') || name.includes('power')) return 20;
        if (name.includes('mouse') || name.includes('keyboard')) return 15;
        return Math.max(5, Math.round((quantity || 0) * 0.4));
    }

    getDefaultForecasts() {
        return [
            {
                productName: 'USB-C Fast Charger',
                currentStock: 8,
                predictedDemand: 30,
                recommendedStock: 35,
                confidence: 89
            }
        ];
    }

    getCustomTasks(context) {
        return [];
    }

    getCopilotAdvice(text) {
        let reply = "Hello! I am your Aisle Electronics Support Assistant. I analyze your hardware catalog, competitor tech accessories pricing, and regional search demands to help grow your shop.";
        let actions = [
            "Complete your store specifications description.",
            "Verify bank KYC details to clear online transactions."
        ];
        let estimatedRevenueIncrease = 3500;

        if (['earn', 'more', 'increase', 'sales', 'growth', 'grow', 'revenue', 'boost', 'month', 'this month'].some(w => text.includes(w))) {
            reply = "Here is your Tech & Accessories Growth Plan to increase revenues this month:";
            actions = [
                "Add USB-C Fast Charger (High demand gap: 140 queries, +₹3,800/mo potential)",
                "Offer bundle campaigns: Charger + USB Cable discount (+₹2,900/mo potential)",
                "Restock Wireless Mouse to capture student/office demands (+₹2,700/mo potential)"
            ];
            estimatedRevenueIncrease = 9400;
        } else if (['stock', 'inventory', 'cable', 'charger', 'mouse'].some(w => text.includes(w))) {
            reply = "I reviewed your tech products stock levels. Here is our analysis:";
            actions = [
                "Restock USB-C Fast Charger immediately (low stock limit reached)",
                "Increase stock density of extension boards prior to weekend shopping hours"
            ];
            estimatedRevenueIncrease = 2000;
        } else if (['payout', 'bank', 'kyc', 'money', 'payment'].some(w => text.includes(w))) {
            reply = "Regarding your settlements, complete this action:";
            actions = [
                "Submit bank verification setup to clear your electronic items payout logs."
            ];
            estimatedRevenueIncrease = 0;
        }

        return { reply, actions, estimatedRevenueIncrease };
    }

    getAIPromptContext() {
        return {
            shopType: "ELECTRONICS_TOOLS",
            businessCategory: "Electronics, Tools & Hardware"
        };
    }
}

module.exports = ElectronicsRules;
