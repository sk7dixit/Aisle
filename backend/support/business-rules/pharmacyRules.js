class PharmacyRules {
    getTrendingProducts() {
        return [
            { id: 1, name: "Vitamin Supplements", searches: 180, trend: "UP" },
            { id: 2, name: "Hand Sanitizer", searches: 120, trend: "STABLE" },
            { id: 3, name: "Face Masks N95", searches: 95, trend: "UP" },
            { id: 4, name: "Protein Powder", searches: 72, trend: "UP" }
        ];
    }

    getSearchGaps() {
        return [
            { name: 'Cold & Flu Medicines', searches: 210, estimatedRevenue: 5200, category: 'Pharmacy' },
            { name: 'Cough Syrup (Herbal)', searches: 115, estimatedRevenue: 2900, category: 'Pharmacy' },
            { name: 'Pain Relief Spray', searches: 98, estimatedRevenue: 1800, category: 'Pharmacy' }
        ];
    }

    getBaseDemand(productName, quantity) {
        const name = (productName || '').toLowerCase();
        if (name.includes('vitamin') || name.includes('supplements')) return 35;
        if (name.includes('mask')) return 20;
        if (name.includes('cold') || name.includes('flu')) return 50;
        return Math.max(5, Math.round((quantity || 0) * 0.35));
    }

    getDefaultForecasts() {
        return [
            {
                productName: 'Cold & Flu Medicines',
                currentStock: 12,
                predictedDemand: 48,
                recommendedStock: 50,
                confidence: 93
            }
        ];
    }

    getCustomTasks(context) {
        return [
            {
                task: "Perform shelf inspection for batch expiry logs",
                priority: "MEDIUM",
                action: "LOG_EXPIRY_CHECK"
            }
        ];
    }

    getCopilotAdvice(text) {
        let reply = "Hello! I am your Aisle Pharmacy Support Assistant. I analyze your medical inventory, regulatory compliance parameters, and seasonal health trends to help optimize your pharmacy.";
        let actions = [
            "Verify your drugs registration license is uploaded.",
            "Complete your bank KYC preference to unlock online payouts."
        ];
        let estimatedRevenueIncrease = 4000;

        if (['earn', 'more', 'increase', 'sales', 'growth', 'grow', 'revenue', 'boost', 'month', 'this month'].some(w => text.includes(w))) {
            reply = "Here is your Pharmacy Growth Plan to maximize sales this month:";
            actions = [
                "Stock Cold & Flu Medicines (High seasonal demand: 210 local queries, +₹5,200/mo potential)",
                "Add Ayurvedic Supplements bundle (+₹3,100/mo potential)",
                "Restock Multivitamins to capture daily health supplement seekers (+₹2,200/mo potential)"
            ];
            estimatedRevenueIncrease = 10500;
        } else if (['stock', 'inventory', 'medicine', 'medicines', 'vitamin'].some(w => text.includes(w))) {
            reply = "I reviewed your medical supply inventory levels. Here are our recommendations:";
            actions = [
                "Increase Cold & Flu Medicines stock to 50 units (expected seasonal spike)",
                "Verify inventory levels of Vitamin Supplements (low stock indicator triggered)"
            ];
            estimatedRevenueIncrease = 3000;
        } else if (['payout', 'bank', 'kyc', 'money', 'payment'].some(w => text.includes(w))) {
            reply = "Regarding your pharmacy settlements, please address this task:";
            actions = [
                "Submit bank verification setup to clear your pending health account payouts."
            ];
            estimatedRevenueIncrease = 0;
        }

        return { reply, actions, estimatedRevenueIncrease };
    }

    getAIPromptContext() {
        return {
            shopType: "PHARMACY_MEDICAL",
            businessCategory: "Medical & Health"
        };
    }
}

module.exports = PharmacyRules;
