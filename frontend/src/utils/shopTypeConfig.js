export const SHOP_TYPE_CONFIG = {
    "GROCERY_KIRANA": {
        label: "Grocery / Kirana",
        categories: [
            "General Provision / Kirana",
            "Fruits & Vegetables",
            "Dairy & Ice Cream",
            "Bakery & Cake Shop",
            "Sweet Shop (Mithai & Farsan)",
            "Dry Fruits & Spices",
            "Wholesale / Grain Mart",
            "Organic / Gourmet",
            "Other"
        ]
    },

    "ELECTRICAL_HARDWARE_AUTO": {
        label: "Electrical, Hardware & Auto",
        categories: [
            "Electrical & Lighting",
            "Hardware & Furniture Fittings",
            "Plumbing & Sanitaryware",
            "Paints & Waterproofing",
            "Automobile Spares & Care",
            "Tools & Industrial Supply",
            "Other"
        ]
    },

    "TECH_ACCESSORIES": {
        label: "Tech & Accessories",
        categories: [
            "Mobiles, Audio & Wearables",
            "Computers, Gaming & Office",
            "TV & Home Appliances",
            "Spares & Repair Components",
            "Other"
        ]
    },

    "STUDENT_OFFICE": {
        label: "Student & Office Supplies",
        categories: [
            "School & Writing Supplies",
            "Office & Desk Accessories",
            "Art & Craft Materials",
            "Books & Paper Products",
            "Other"
        ]
    },

    "HOME_LIFESTYLE": {
        label: "Home & Lifestyle Goods",
        categories: [
            "Kitchenware & Cookware",
            "Plastics, Cleaning & Storage",
            "Beauty, Cosmetics & Personal Care",
            "Toys, Sports & Gifts",
            "Furnishing & Home Decor",
            "Bags & Luggage",
            "Footwear",
            "Clothing & Garments",
            "Other"
        ]
    },

    "PHARMACY": {
        label: "Pharmacy / Medical Store",
        categories: [
            "Allopathic Medicines",
            "Ayurvedic & Wellness",
            "Surgical, Rehab & General",
            "Other"
        ]
    },

    "HOME_BUSINESS": {
        label: "Home Businesses",
        categories: [
            "Homemade Food, Bakery & Catering",
            "Handmade Arts, Crafts & Jewelry",
            "Tuition, Coaching & Skill Classes",
            "Other"
        ]
    },

    "SEASONAL_FESTIVE": {
        label: "Seasonal / Festive Store",
        categories: [
            "Festival Specific",
            "Crackers & Fireworks",
            "Winter / Rain Gear",
            "Other"
        ]
    }
};

// Helper to get categories for a shop type (by key or label)
export const getCategoriesForShopType = (shopTypeKeyOrLabel) => {
    if (!shopTypeKeyOrLabel) return SHOP_TYPE_CONFIG["GROCERY_KIRANA"].categories;

    // 1. Try direct key lookup
    if (SHOP_TYPE_CONFIG[shopTypeKeyOrLabel]) {
        return SHOP_TYPE_CONFIG[shopTypeKeyOrLabel].categories;
    }

    // 2. Try label lookup (exact match)
    const configByLabel = Object.values(SHOP_TYPE_CONFIG).find(
        c => c.label === shopTypeKeyOrLabel
    );
    if (configByLabel) return configByLabel.categories;

    // 3. Try flexible normalization (remove spaces, uppercase)
    const normalizedInput = shopTypeKeyOrLabel.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Check keys
    const keyMatch = Object.keys(SHOP_TYPE_CONFIG).find(key =>
        key.replace(/[^A-Z0-9]/g, '') === normalizedInput
    );
    if (keyMatch) return SHOP_TYPE_CONFIG[keyMatch].categories;

    // Check labels
    const labelMatch = Object.values(SHOP_TYPE_CONFIG).find(c =>
        c.label.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedInput
    );
    if (labelMatch) return labelMatch.categories;

    console.warn(`ShopLens Warning: Unknown shop type '${shopTypeKeyOrLabel}'. Filtering may be incorrect.`);
    return SHOP_TYPE_CONFIG["GROCERY_KIRANA"].categories;
};

// Helper to validate if a category is allowed for a shop type
export const isCategoryAllowedForShopType = (category, shopTypeKeyOrLabel) => {
    const allowedCategories = getCategoriesForShopType(shopTypeKeyOrLabel);
    return allowedCategories.includes(category);
};
