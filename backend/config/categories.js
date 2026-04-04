/**
 * MASTER CATEGORY LIST
 * Single Source of Truth for ShopLens Categories.
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
    { id: 'electrical-lighting', label: 'Electrical & Lighting', icon: '💡', group: 'Electrical & Hardware' },
    { id: 'hardware-fittings', label: 'Hardware & Furniture Fittings', icon: '🔩', group: 'Electrical & Hardware' },
    { id: 'plumbing-sanitary', label: 'Plumbing & Sanitaryware', icon: '🚿', group: 'Electrical & Hardware' },
    { id: 'paints-waterproofing', label: 'Paints & Waterproofing', icon: '🎨', group: 'Electrical & Hardware' },
    { id: 'automobile-spares', label: 'Automobile Spares & Care', icon: '🏍️', group: 'Electrical & Hardware' },
    { id: 'tools-industrial', label: 'Tools & Industrial Supply', icon: '🔧', group: 'Electrical & Hardware' },

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
    { id: 'allopathic-medicines', label: 'Allopathic Medicines', icon: '💊', group: 'Pharmacy & Wellness' },
    { id: 'ayurvedic-wellness', label: 'Ayurvedic & Wellness', icon: '🌿', group: 'Pharmacy & Wellness' },
    { id: 'surgical-rehab', label: 'Surgical, Rehab & General', icon: '🏥', group: 'Pharmacy & Wellness' },

    // --- 8. Home Businesses ---
    { id: 'homemade-food', label: 'Homemade Food, Bakery & Catering', icon: '🍱', group: 'Home Businesses' },
    { id: 'handmade-crafts', label: 'Handmade Arts, Crafts & Jewelry', icon: '🧶', group: 'Home Businesses' },
    { id: 'tuition-coaching', label: 'Tuition, Coaching & Skill Classes', icon: '🎓', group: 'Home Businesses' },

    // --- 9. Seasonal / Festive Store ---
    { id: 'festival-specific', label: 'Festival Specific', icon: '🪔', group: 'Seasonal & Festive' },
    { id: 'crackers-fireworks', label: 'Crackers & Fireworks', icon: '🎆', group: 'Seasonal & Festive' },
    { id: 'winter-rain-gear', label: 'Winter / Rain Gear', icon: '☔', group: 'Seasonal & Festive' }
];

module.exports = CATEGORIES;
