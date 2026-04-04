// SafeAIService.js
// A mocked, reliable AI service that suggests subcategories based on keywords.
// This enforces the "Advisory, Not Authoritative" principle.

const SUB_CATEGORY_KEYWORDS = {
    'Dairy & Bakery': ['milk', 'curd', 'paneer', 'bread', 'butter', 'cheese', 'yogurt', 'cream', 'biscuit', 'toast'],
    'Staples & Spices': ['atta', 'rice', 'dal', 'flour', 'sugar', 'salt', 'oil', 'spice', 'turmeric', 'chilli'],
    'Snacks & Drinks': ['chips', 'cola', 'soda', 'juice', 'chocolate', 'candy', 'namkeen', 'popcorn'],
    'Personal Care': ['soap', 'shampoo', 'toothpaste', 'brush', 'oil', 'cream', 'lotion'],
    'Household': ['cleaner', 'detergent', 'soap', 'mop', 'broom', 'bulb'],
};

export const analyzeProductText = async (name, description, shopType) => {
    // Simulate network delay for realistic "AI thinking" feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const text = `${name} ${description}`.toLowerCase();

    let bestMatch = null;
    let maxScore = 0;

    // Simple keyword matching (Deterministic & Explainable)
    for (const [category, keywords] of Object.entries(SUB_CATEGORY_KEYWORDS)) {
        let score = 0;
        keywords.forEach(keyword => {
            if (text.includes(keyword)) score += 1;
        });

        if (score > maxScore) {
            maxScore = score;
            bestMatch = category;
        }
    }

    // Fallback or "Low Confidence"
    if (maxScore === 0) {
        return {
            suggested: null,
            confidence: 'low',
            reason: 'No detailed match found. Please select manually.'
        };
    }

    return {
        suggested: bestMatch,
        confidence: maxScore >= 2 ? 'high' : 'medium',
        reason: `Based on keywords in your product name.`
    };
};
