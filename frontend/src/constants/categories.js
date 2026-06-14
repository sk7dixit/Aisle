/**
 * MASTER CATEGORY LIST (Frontend)
 * Single Source of Truth for UI.
 * Synced with User's Strict Schema.
 */

export const CATEGORIES = [
    // --- 1. Grocery / Kirana ---
    { id: 'general-provision', label: 'General Provision / Kirana', icon: '🥕', group: 'Daily Needs & Food' },
    { id: 'fruits-vegetables', label: 'Fruits & Vegetables', icon: '🥬', group: 'Daily Needs & Food' },
    { id: 'dairy-ice-cream', label: 'Dairy & Ice Cream', icon: '🥛', group: 'Daily Needs & Food' },
    { id: 'bakery-cake-shop', label: 'Bakery & Cake Shop', icon: '🎂', group: 'Daily Needs & Food' },
    { id: 'sweet-shop', label: 'Sweet Shop (Mithai & Farsan)', icon: '🍬', group: 'Daily Needs & Food' },
    { id: 'dry-fruits-spices', label: 'Dry Fruits & Spices', icon: '🌶️', group: 'Daily Needs & Food' },
    { id: 'wholesale-grain', label: 'Wholesale / Grain Mart', icon: '🌾', group: 'Daily Needs & Food' },
    { id: 'organic-gourmet', label: 'Organic / Gourmet', icon: '🥣', group: 'Daily Needs & Food' },

    // --- 2. Electrical, Hardware & Auto ---
    { id: 'electrical-shop', label: 'Electrical Shop', icon: '💡', group: 'Electrical & Hardware' },
    { id: 'hardware-sanitary', label: 'Hardware & Sanitary', icon: '🔩', group: 'Electrical & Hardware' },
    { id: 'paints-decor', label: 'Paints & Decor', icon: '🎨', group: 'Electrical & Hardware' },
    { id: 'automobile-spares', label: 'Automobile Spares', icon: '🏍️', group: 'Electrical & Hardware' },
    { id: 'tools-industrial', label: 'Industrial / Power Tools', icon: '🔧', group: 'Electrical & Hardware' },

    // --- 3. Tech & Accessories ---
    { id: 'mobiles-wearables', label: 'Mobiles, Audio & Wearables', icon: '📱', group: 'Tech & Accessories' },
    { id: 'computers-gaming', label: 'Computers, Gaming & Office', icon: '💻', group: 'Tech & Accessories' },
    { id: 'tv-appliances', label: 'TV & Home Appliances', icon: '📺', group: 'Tech & Accessories' },
    { id: 'spares-components', label: 'Spares & Repair Components', icon: '🔋', group: 'Tech & Accessories' },

    // --- 4. Student & Office Supplies ---
    { id: 'school-writing', label: 'School & Writing Supplies', icon: '🎒', group: 'Student & Office' },
    { id: 'office-desk', label: 'Office & Desk Accessories', icon: '📎', group: 'Student & Office' },
    { id: 'art-craft', label: 'Art & Craft Materials', icon: '🎨', group: 'Student & Office' },
    { id: 'books-paper', label: 'Books & Paper Products', icon: '📚', group: 'Student & Office' },

    // --- 5. Home & Lifestyle Goods ---
    { id: 'kitchenware-cookware', label: 'Kitchenware & Cookware', icon: '🍳', group: 'Home & Lifestyle' },
    { id: 'plastics-cleaning', label: 'Plastics, Cleaning & Storage', icon: '🧹', group: 'Home & Lifestyle' },
    { id: 'beauty-personal', label: 'Beauty, Cosmetics & Personal Care', icon: '💄', group: 'Home & Lifestyle' },
    { id: 'toys-sports', label: 'Toys, Sports & Gifts', icon: '⚽', group: 'Home & Lifestyle' },
    { id: 'furnishing-decor', label: 'Furnishing & Home Decor', icon: '🛏️', group: 'Home & Lifestyle' },
    { id: 'bags-luggage', label: 'Bags & Luggage', icon: '👜', group: 'Home & Lifestyle' },
    { id: 'footwear', label: 'Footwear', icon: '👟', group: 'Home & Lifestyle' },
    { id: 'clothing-garments', label: 'Clothing & Garments', icon: '👕', group: 'Home & Lifestyle' },

    // --- 6. Pharmacy / Medical Store ---
    { id: 'allopathic-chemist', label: 'Allopathic Chemist', icon: '💊', group: 'Pharmacy & Wellness' },
    { id: 'ayurvedic-herbal', label: 'Ayurvedic & Herbal', icon: '🌿', group: 'Pharmacy & Wellness' },
    { id: 'surgical-equipment', label: 'Surgical & Equipment', icon: '🏥', group: 'Pharmacy & Wellness' },



    // --- 9. Seasonal / Festive Store ---
    { id: 'festival-specific', label: 'Festival Specific', icon: '🪔', group: 'Seasonal & Festive' },
    { id: 'crackers-fireworks', label: 'Crackers & Fireworks', icon: '🎆', group: 'Seasonal & Festive' },
    { id: 'winter-rain-gear', label: 'Winter / Rain Gear', icon: '☔', group: 'Seasonal & Festive' }
];

/**
 * STRICT MAPPING: Shop Type -> Allowed Category IDs
 * This ensures exact matching of what the user defines.
 */
export const SHOP_TYPE_TO_IDS = {
    "GROCERY_KIRANA": [
        'general-provision', 'fruits-vegetables', 'dairy-ice-cream',
        'bakery-cake-shop', 'sweet-shop', 'dry-fruits-spices',
        'wholesale-grain', 'organic-gourmet'
    ],
    "ELECTRICAL_HARDWARE_AUTO": [
        'electrical-shop', 'hardware-sanitary', 'paints-decor',
        'automobile-spares', 'tools-industrial'
    ],
    "TECH_ACCESSORIES": [
        'mobiles-wearables', 'computers-gaming', 'tv-appliances', 'spares-components'
    ],
    "STUDENT_OFFICE": [
        'school-writing', 'office-desk', 'art-craft', 'books-paper'
    ],
    "HOME_LIFESTYLE": [
        'kitchenware-cookware', 'plastics-cleaning', 'beauty-personal',
        'toys-sports', 'furnishing-decor', 'bags-luggage', 'footwear', 'clothing-garments'
    ],
    "PHARMACY": [
        'allopathic-chemist', 'ayurvedic-herbal', 'surgical-equipment'
    ],

    "SEASONAL_FESTIVE": [
        'festival-specific', 'crackers-fireworks', 'winter-rain-gear'
    ]
};

/**
 * Helper to get categories for a specific shop type
 * Fallback: If shop type mismatches, return nothing or all (Safety: Log warning)
 */
export const getCategoriesForShop = (shopType) => {
    if (!shopType) return CATEGORIES;

    // Normalize shopType to match keys in SHOP_TYPE_TO_IDS
    let key = shopType.toUpperCase().trim();

    // Map human-friendly category names/labels to strict uppercase keys
    if (key.includes("GROCERY") || key.includes("KIRANA")) {
        key = "GROCERY_KIRANA";
    } else if (key.includes("ELECTRICAL") || key.includes("HARDWARE") || key.includes("AUTO") || key.includes("ELECTRONICS")) {
        key = "ELECTRICAL_HARDWARE_AUTO";
    } else if (key.includes("TECH") || key.includes("ACCESSORIES")) {
        key = "TECH_ACCESSORIES";
    } else if (key.includes("STUDENT") || key.includes("OFFICE")) {
        key = "STUDENT_OFFICE";
    } else if (key.includes("LIFESTYLE") || key.includes("HOME & LIFESTYLE")) {
        key = "HOME_LIFESTYLE";
    } else if (key.includes("PHARMACY") || key.includes("MEDICAL")) {
        key = "PHARMACY";

    } else if (key.includes("SEASONAL") || key.includes("FESTIVE")) {
        key = "SEASONAL_FESTIVE";
    }

    if (!SHOP_TYPE_TO_IDS[key]) {
        console.warn(`Aisle Warning: Unknown shop type "${shopType}" (normalized to "${key}"). Filtering may be incorrect.`);
        return CATEGORIES;
    }

    const allowedIds = SHOP_TYPE_TO_IDS[key];
    return CATEGORIES.filter(cat => allowedIds.includes(cat.id));
};
