/**
 * MASTER CATEGORY LIST
 * Single Source of Truth for Aisle Categories.
 * Used by both Backend (Validation/API) and Frontend (UI/Icons).
 * 
 * Structure:
 * - id: unique slug (kebab-case) used in DB and URLs
 * - label: Display Name
 * - icon: Emoji or Icon Name (for frontend)
 * - group: Grouping for UI (Daily Needs, Tech, etc.)
 */

const CATEGORIES = [
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

CATEGORIES.grocery = [
    'General Provision / Kirana',
    'Fruits & Vegetables',
    'Dairy & Ice Cream',
    'Bakery & Cake Shop',
    'Sweet Shop',
    'Dry Fruits & Spices',
    'Wholesale / Grain Mart',
    'Organic / Gourmet'
];

CATEGORIES.electronics = [
    'Mobiles, Audio & Wearables',
    'Computers, Gaming & Office',
    'TV & Home Appliances',
    'Spares & Repair Components',
    'Electrical Shop',
    'Hardware & Sanitary',
    'Paints & Decor',
    'Automobile Spares',
    'Industrial / Power Tools'
];

CATEGORIES.pharmacy = [
    'Allopathic Chemist',
    'Ayurvedic & Herbal',
    'Surgical & Equipment'
];

CATEGORIES.stationery = [
    'School & Writing Supplies',
    'Office & Desk Accessories',
    'Art & Craft Materials',
    'Books & Paper Products'
];

CATEGORIES.lifestyle = [
    'Kitchenware & Cookware',
    'Plastics, Cleaning & Storage',
    'Beauty, Cosmetics & Personal Care',
    'Toys, Sports & Gifts',
    'Furnishing & Home Decor',
    'Bags & Luggage',
    'Footwear',
    'Clothing & Garments'
];

module.exports = CATEGORIES;
