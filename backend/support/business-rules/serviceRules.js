class ServiceRules {
    getTrendingProducts() {
        return [
            { id: 1, name: "Standard AC Service", searches: 195, trend: "UP" },
            { id: 2, name: "Deep Cleaning Package", searches: 140, trend: "UP" },
            { id: 3, name: "Full House Electrical Check", searches: 88, trend: "STABLE" },
            { id: 4, name: "Haircut & Grooming Package", searches: 70, trend: "UP" }
        ];
    }

    getSearchGaps() {
        return [
            { name: 'AC Gas Refill Service', searches: 110, estimatedRevenue: 3500, category: 'Services' },
            { name: 'Urgent Plumbing Repair', searches: 92, estimatedRevenue: 2800, category: 'Services' },
            { name: 'Sofa Dry Cleaning', searches: 75, estimatedRevenue: 2100, category: 'Services' }
        ];
    }

    getBaseDemand(productName, quantity) {
        const name = (productName || '').toLowerCase();
        if (name.includes('ac') || name.includes('cooling')) return 20; // bookings
        if (name.includes('clean') || name.includes('sofa')) return 12;
        if (name.includes('plumb') || name.includes('repair')) return 8;
        return Math.max(3, Math.round((quantity || 0) * 0.3));
    }

    getDefaultForecasts() {
        return [
            {
                productName: 'Expected Service Bookings',
                currentStock: 5, // Active bookings
                predictedDemand: 18, // Predicted inquiries
                recommendedStock: 20, // Targeted bookings capacity
                confidence: 91
            }
        ];
    }

    getCustomTasks(context) {
        // Services don't check product stock, we generate booking and leads tasks!
        return [
            {
                task: "Follow up on 7 missed customer leads (Est. Revenue Loss: ₹3,500)",
                priority: "HIGH",
                action: "RESOLVE_LEADS"
            },
            {
                task: "Confirm 4 pending appointments in your service queue",
                priority: "MEDIUM",
                action: "CONFIRM_APPOINTMENTS"
            },
            {
                task: "Improve booking response time (Current avg: 28 minutes, target: under 15 mins)",
                priority: "LOW",
                action: "OPTIMIZE_RESPONSE"
            }
        ];
    }

    getCopilotAdvice(text) {
        let reply = "Hello! I am your Aisle Service Business Advisor. I analyze your lead conversion rates, pending bookings, client response times, and local service package gaps to optimize your business.";
        let actions = [
            "Verify your UPI billing preferences to receive direct booking prepayments.",
            "Complete your business catalog bio listing your service coverage zones."
        ];
        let estimatedRevenueIncrease = 3500;

        if (['earn', 'more', 'increase', 'sales', 'growth', 'grow', 'revenue', 'boost', 'month', 'this month'].some(w => text.includes(w))) {
            reply = "I completed a booking efficiency audit. Here is your Service Growth Plan to maximize conversions this month:";
            actions = [
                "Call back 7 missed inquiries promptly (Potential revenue lift: +₹3,500)",
                "Add AC Gas Refill Package (High demand gap: 110 local queries, +₹3,500/mo potential)",
                "Offer a 10% discount combo on Home Deep Cleaning + Sofa Dry Cleaning (+₹4,200/mo potential)"
            ];
            estimatedRevenueIncrease = 11200;
        } else if (['stock', 'inventory', 'item', 'product', 'items', 'products'].some(w => text.includes(w))) {
            reply = "As a service provider, you don't stock physical products. Instead, I analyzed your service capacity and booking queues:";
            actions = [
                "Confirm 4 pending appointments immediately to prevent scheduling overlaps",
                "Extend AC Service slots for the upcoming weekend to capture higher booking frequency"
            ];
            estimatedRevenueIncrease = 1500;
        } else if (['payout', 'bank', 'kyc', 'money', 'payment', 'inquiry', 'booking'].some(w => text.includes(w))) {
            reply = "Regarding your booking payments and settlements:";
            actions = [
                "Submit bank verification setup to clear your client prepayment balances."
            ];
            estimatedRevenueIncrease = 0;
        }

        return { reply, actions, estimatedRevenueIncrease };
    }

    getAIPromptContext() {
        return {
            shopType: "SERVICES",
            businessCategory: "Local Services & Bookings"
        };
    }
}

module.exports = ServiceRules;
