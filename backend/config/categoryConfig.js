
const CATEGORY_CONFIG = {
    grocery_kirana: {
        label: "Grocery / Kirana",
        subCategories: ["general_provision", "dairy_bakery", "sweets_farsan", "dry_fruits_spices", "wholesale", "organic", "other"]
    },
    electronics_tools: {
        label: "Electronics & Tools",
        subCategories: ["electrical", "hardware", "paint", "automobile", "industrial", "other"]
    },
    tech_accessories: {
        label: "Tech & Accessories",
        subCategories: ["mobile", "computer", "consumer_electronics", "repair", "other"]
    },
    student_office: {
        label: "Student & Office Supplies",
        subCategories: ["stationery", "books", "art", "office", "other"]
    },
    home_lifestyle: {
        label: "Home & Lifestyle Goods",
        subCategories: ["kitchenware", "cleaning", "gifts", "bags", "footwear", "clothing", "furnishing", "other"]
    },
    pharmacy: {
        label: "Pharmacy / Medical Store",
        subCategories: ["allopathic", "ayurvedic", "surgical", "other"]
    },
    home_business: {
        label: "Home Businesses",
        subCategories: ["food", "handicrafts", "other"]
    },
    seasonal: {
        label: "Seasonal / Festive Store",
        subCategories: ["festival", "crackers", "weather", "other"]
    },
    // Dynamic / Fallbacks handled in resolver
    pet_shop: {
        label: "Pet Shop",
        subCategories: ["pet_food", "pet_accessories", "other"]
    },
    nursery_plants: {
        label: "Nursery / Plants",
        subCategories: ["plants", "pots", "fertilizers", "other"]
    },
    services: {
        label: "Services",
        subCategories: ["home_repair", "beauty_wellness", "cleaning", "consultancy", "delivery", "other"]
    },
    unmatched_other: {
        label: "Other",
        subCategories: []
    }
};

const CATEGORY_KEY_MAP = {
    "Grocery / Kirana": "grocery_kirana",
    "Electronics & Tools": "electronics_tools",
    "Tech & Accessories": "tech_accessories",
    "Student & Office Supplies": "student_office",
    "Home & Lifestyle Goods": "home_lifestyle",
    "Pharmacy / Medical Store": "pharmacy",
    "Home Businesses": "home_business",
    "Seasonal / Festive Store": "seasonal",
    "Services": "services",
    "Other": "other"
};

// Helper to resolve category
const resolveShopCategory = (category, customInput) => {
    // 1. Standard Category Match
    if (category !== "Other" && CATEGORY_KEY_MAP[category]) {
        const key = CATEGORY_KEY_MAP[category];
        if (CATEGORY_CONFIG[key]) {
            return {
                resolvedKey: key,
                allowedSubCategories: CATEGORY_CONFIG[key].subCategories
            };
        }
    }

    // 2. "Other" Category Logic
    if (category === "Other" && customInput) {
        const input = customInput.toLowerCase();

        if (input.includes("pet")) {
            return {
                resolvedKey: "pet_shop",
                allowedSubCategories: CATEGORY_CONFIG.pet_shop.subCategories
            };
        }
        if (input.includes("nursery") || input.includes("plant")) {
            return {
                resolvedKey: "nursery_plants",
                allowedSubCategories: CATEGORY_CONFIG.nursery_plants.subCategories
            };
        }
    }

    // 3. Fallback / Unmatched
    return {
        resolvedKey: "unmatched_other",
        allowedSubCategories: CATEGORY_CONFIG.unmatched_other.subCategories
    };
};

module.exports = {
    CATEGORY_CONFIG,
    resolveShopCategory
};
