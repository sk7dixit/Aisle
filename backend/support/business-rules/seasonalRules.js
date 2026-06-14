class SeasonalRules {
    getTrendingProducts() {
        return [
            { id: 1, name: "Diwali Lights", searches: 240, trend: "UP" },
            { id: 2, name: "Gift Packs", searches: 180, trend: "UP" },
            { id: 3, name: "Festival Decorations", searches: 150, trend: "UP" },
            { id: 4, name: "Seasonal Rain/Winter Gear", searches: 92, trend: "STABLE" }
        ];
    }

    getSearchGaps() {
        return [
            { name: 'Clay Diyas (Handmade)', searches: 190, estimatedRevenue: 3200, category: 'Seasonal' },
            { name: 'LED String Lights', searches: 165, estimatedRevenue: 4900, category: 'Seasonal' },
            { name: 'Dry Fruit Festive Gift Packs', searches: 120, estimatedRevenue: 6800, category: 'Seasonal' }
        ];
    }

    getBaseDemand(productName, quantity) {
        const name = (productName || '').toLowerCase();
        if (name.includes('light') || name.includes('diya')) return 50;
        if (name.includes('gift') || name.includes('pack')) return 30;
        if (name.includes('rain') || name.includes('umbrella')) return 40;
        return Math.max(5, Math.round((quantity || 0) * 0.5));
    }

    getDefaultForecasts() {
        return [
            {
                productName: 'LED String Lights',
                currentStock: 15,
                predictedDemand: 75,
                recommendedStock: 80,
                confidence: 94
            }
        ];
    }

    getCustomTasks(context) {
        return [
            {
                task: "Diwali festival approaching: stock up on decorations & LED string lights",
                priority: "HIGH",
                action: "FESTIVE_STOCK"
            }
        ];
    }

    getCopilotAdvice(text) {
        let reply = "Hello! I am your Aisle Seasonal Store Advisor. I analyze local calendar events, weather spikes, and upcoming festivals to recommend high-velocity seasonal inventories.";
        let actions = [
            "Complete your holiday schedule settings.",
            "Verify bank account UPI setup to handle high-volume festive prepayments."
        ];
        let estimatedRevenueIncrease = 5000;

        if (['earn', 'more', 'increase', 'sales', 'growth', 'grow', 'revenue', 'boost', 'month', 'this month'].some(w => text.includes(w))) {
            reply = "Diwali and festive peaks are approaching. Here is your Seasonal Growth Plan to optimize revenues:";
            actions = [
                "Stock LED String Lights (High seasonal demand: 165 queries, +₹4,900/mo potential)",
                "Add Dry Fruit Festive Gift Packs to catalog (+₹6,800/mo potential)",
                "Offer a 10% discount on Bulk Clay Diyas orders (+₹3,200/mo potential)"
            ];
            estimatedRevenueIncrease = 14900;
        } else if (['stock', 'inventory', 'light', 'lights', 'diya', 'diyas'].some(w => text.includes(w))) {
            reply = "I reviewed your festival product inventories. Here is our stock recommendation:";
            actions = [
                "Increase LED String Lights stock to 80 units prior to next week's festive buying peak",
                "Source additional clay diyas to cover localized demand spikes"
            ];
            estimatedRevenueIncrease = 3500;
        } else if (['payout', 'bank', 'kyc', 'money', 'payment'].some(w => text.includes(w))) {
            reply = "Regarding your cash settlements:";
            actions = [
                "Submit bank verification setup to clear your high-volume holiday payouts."
            ];
            estimatedRevenueIncrease = 0;
        }

        return { reply, actions, estimatedRevenueIncrease };
    }

    getAIPromptContext() {
        return {
            shopType: "SEASONAL_FESTIVE",
            businessCategory: "Seasonal & Festive Supplies"
        };
    }
}

module.exports = SeasonalRules;
