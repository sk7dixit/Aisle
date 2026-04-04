const { SHOP_CATEGORIES } = require('../config/shopCategories');

/**
 * Normalizes input string for comparison (lowercase, trimmed)
 * @param {string} input 
 * @returns {string}
 */
const normalizeInput = (input) => {
    if (!input) return '';
    return input.toLowerCase().trim();
};

/**
 * Resolves allowed sub-categories based on the main category and custom input.
 * Implements strict logic:
 * 1. If category != 'Other', return mapped list.
 * 2. If category == 'Other', match customInput against known keywords.
 * @param {string} category - The selected main category
 * @param {string} [customInput] - The text input if category is 'Other'
 * @returns {string[]} - Array of allowed sub-categories
 */
const resolveSubCategories = (category, customInput = '') => {
    if (category !== 'Other' && category !== 'Other / Not Listed') {
        return SHOP_CATEGORIES[category] || [];
    }

    // Strict Matching for "Other"
    const normalized = normalizeInput(customInput);

    if (normalized.includes('pet')) {
        return ['Pet Food', 'Pet Accessories', 'Pet Toys', 'Aquarium / Fish', 'Veterinary Products'];
    }

    if (normalized.includes('nursery') || normalized.includes('plant') || normalized.includes('garden')) {
        return ['Plants', 'Seeds & Fertilizers', 'Pots & Planters', 'Gardening Tools'];
    }

    // Default for unmatched "Other" - Empty list (User sees "Sub-categories will be enabled later")
    return [];
};

module.exports = {
    resolveSubCategories,
    normalizeInput
};
