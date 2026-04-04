const SHOP_TYPE_CONFIG = {
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

const getCategoriesForShopType = (shopTypeKeyOrLabel) => {
    if (SHOP_TYPE_CONFIG[shopTypeKeyOrLabel]) {
        return SHOP_TYPE_CONFIG[shopTypeKeyOrLabel].categories;
    }

    const config = Object.values(SHOP_TYPE_CONFIG).find(
        c => c.label === shopTypeKeyOrLabel
    );

    return config ? config.categories : SHOP_TYPE_CONFIG["GROCERY_KIRANA"].categories;
};

const isCategoryAllowedForShopType = (category, shopTypeKeyOrLabel) => {
    const allowedCategories = getCategoriesForShopType(shopTypeKeyOrLabel);
    return allowedCategories.includes(category);
};

module.exports = {
    SHOP_TYPE_CONFIG,
    getCategoriesForShopType,
    isCategoryAllowedForShopType
};
