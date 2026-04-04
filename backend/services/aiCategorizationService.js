const CATEGORIES = [
    { name: 'Grocery / Kirana', keywords: ['grocery', 'kirana', 'store', 'essentials', 'food', 'milk', 'bread', 'vegetables', 'fruits'] },
    { name: 'Electronics & Tools', keywords: ['electronics', 'repair', 'tools', 'mobile', 'washing machine', 'fridge', 'appliances'] },
    { name: 'Tech & Accessories', keywords: ['laptop', 'computer', 'digital', 'tech', 'accessories', 'mobile cover', 'headphones'] },
    { name: 'Student & Office Supplies', keywords: ['books', 'stationary', 'office', 'pen', 'copy', 'calculator', 'print'] },
    { name: 'Home & Lifestyle Goods', keywords: ['furniture', 'home', 'lifestyle', 'decor', 'curtain', 'cosmetics', 'boutique'] },
    { name: 'Pharmacy / Medical Store', keywords: ['pharmacy', 'medical', 'medicine', 'health', 'clinic', 'chemist', 'surgical'] },
    { name: 'Home Businesses', keywords: ['handmade', 'home', 'homemade', 'pickle', 'aachar', 'papad', 'knitting', 'cake'] },
    { name: 'Seasonal / Festive Store', description: ['festival', 'diwali', 'holi', 'rakhi', 'christmas', 'seasonal', 'temporary'] },
];

/**
 * Categorizes a shop based on its name and description.
 * Mimics an AI model's probability output.
 * @param {string} name 
 * @param {string} description 
 * @returns {Array} List of suggestions with probabilities
 */
const categorizeShop = async (name, description) => {
    const text = (name + ' ' + (description || '')).toLowerCase();
    const suggestions = [];

    CATEGORIES.forEach(cat => {
        let score = 0;
        cat.keywords?.forEach(kw => {
            if (text.includes(kw)) {
                score += 0.2; // Base weight per keyword match
            }
        });

        if (score > 0) {
            // Cap at 0.95 to keep it "AI-like"
            const finalScore = Math.min(score + (Math.random() * 0.1), 0.95);
            suggestions.push({
                category: cat.name,
                confidence: parseFloat(finalScore.toFixed(2))
            });
        }
    });

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // If no match, add a low confidence fallback
    if (suggestions.length === 0) {
        suggestions.push({
            category: 'General',
            confidence: 0.1
        });
    }

    return suggestions;
};

module.exports = { categorizeShop };
