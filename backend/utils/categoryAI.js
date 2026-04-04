/**
 * CATEGORY AI ROUTING ENGINE (UNIVERSAL)
 * 
 * Logic:
 * 1. Load Allowed Categories for Shop Type (Dynamic)
 * 2. Keyword/Synonym Match
 * 3. Exact Category Name Match
 * 4. Strict Enforcement (Output MUST be in allowed list)
 */

const { getCategoriesForShopType } = require('./shopTypeConfig');

// KEYWORD DICTIONARY (Maps Keywords -> Recommended Category Name)
// This can be expanded for other shop types. 
// Currently optimized for Grocery/Kirana as per active requirements.
const KEYWORD_MAP = {
    // GROCERY / KIRANA
    "rice": "General Provision / Kirana", "basmati": "General Provision / Kirana", "atta": "General Provision / Kirana",
    "flour": "General Provision / Kirana", "oil": "General Provision / Kirana", "salt": "General Provision / Kirana",
    "sugar": "General Provision / Kirana", "dal": "General Provision / Kirana", "pulse": "General Provision / Kirana",
    "soap": "General Provision / Kirana", "shampoo": "General Provision / Kirana", "detergent": "General Provision / Kirana",
    "toothpaste": "General Provision / Kirana", "cleaner": "General Provision / Kirana",

    "milk": "Dairy & Ice Cream", "curd": "Dairy & Ice Cream", "paneer": "Dairy & Ice Cream", "butter": "Dairy & Ice Cream",
    "cheese": "Dairy & Ice Cream", "ice cream": "Dairy & Ice Cream", "dahi": "Dairy & Ice Cream", "yogurt": "Dairy & Ice Cream",

    "potato": "Fruits & Vegetables", "onion": "Fruits & Vegetables", "tomato": "Fruits & Vegetables", "vegetable": "Fruits & Vegetables",
    "fruit": "Fruits & Vegetables", "apple": "Fruits & Vegetables", "banana": "Fruits & Vegetables",

    "bread": "Bakery & Cake Shop", "cake": "Bakery & Cake Shop", "biscuit": "Bakery & Cake Shop", "rusk": "Bakery & Cake Shop",
    "toast": "Bakery & Cake Shop",

    "chocolate": "Sweet Shop (Mithai & Farsan)", "mithai": "Sweet Shop (Mithai & Farsan)", "sweet": "Sweet Shop (Mithai & Farsan)",
    "namkeen": "Sweet Shop (Mithai & Farsan)", "bhujia": "Sweet Shop (Mithai & Farsan)", "chips": "Sweet Shop (Mithai & Farsan)",

    "almond": "Dry Fruits & Spices", "cashew": "Dry Fruits & Spices", "kishmish": "Dry Fruits & Spices",
    "chilli": "Dry Fruits & Spices", "turmeric": "Dry Fruits & Spices", "spice": "Dry Fruits & Spices",

    // ELECTRICAL / HARDWARE (Basic coverage)
    "bulb": "Electrical & Lighting", "led": "Electrical & Lighting", "switch": "Electrical & Lighting", "wire": "Electrical & Lighting",
    "hammer": "Tools & Industrial Supply", "drill": "Tools & Industrial Supply", "screw": "Hardware & Furniture Fittings",
    "pipe": "Plumbing & Sanitaryware", "paint": "Paints & Waterproofing",

    // PHARMACY
    "tablet": "Allopathic Medicines", "syrup": "Allopathic Medicines", "capsule": "Allopathic Medicines",
    "protein": "Ayurvedic & Wellness", "thermometer": "Surgical, Rehab & General"
};

const BRAND_MAP = {
    "amul": "Dairy & Ice Cream",
    "mother dairy": "Dairy & Ice Cream",
    "britannia": "Bakery & Cake Shop",
    "cadbury": "Sweet Shop (Mithai & Farsan)",
    "haldiram": "Sweet Shop (Mithai & Farsan)",
    "tata": "General Provision / Kirana",
    "aashirvaad": "General Provision / Kirana",
    "fortune": "General Provision / Kirana",
    "surf excel": "General Provision / Kirana",
    "colgate": "General Provision / Kirana",
    "havells": "Electrical & Lighting",
    "philips": "Electrical & Lighting",
    "asian paints": "Paints & Waterproofing",
    "cipla": "Allopathic Medicines"
};

const CATEGORIES = require('../config/categories');

/**
 * Assigns category based on name and brand within a shop boundary
 */
const assignCategoryAI = (productName, brand = "", shopType = "GROCERY_KIRANA") => {
    const nameLower = (productName || "").toLowerCase();
    const brandLower = (brand || "").toLowerCase();

    // 1. Get Allowed Categories (Strict Boundary)
    const allowedCategories = getCategoriesForShopType(shopType);

    if (!allowedCategories || allowedCategories.length === 0) {
        return { category: "Other", categorySlug: "other", needsReview: true };
    }

    let detectedCategory = null;

    // 2. Brand Match (Highest Confidence)
    if (brandLower) {
        for (const [key, catName] of Object.entries(BRAND_MAP)) {
            if (brandLower.includes(key)) {
                if (allowedCategories.includes(catName)) {
                    detectedCategory = catName;
                    break;
                }
            }
        }
    }

    // 3. Keyword Match (Medium Confidence)
    if (!detectedCategory) {
        for (const [keyword, catName] of Object.entries(KEYWORD_MAP)) {
            if (nameLower.includes(keyword)) {
                if (allowedCategories.includes(catName)) {
                    detectedCategory = catName;
                    break;
                }
            }
        }
    }

    // 4. Fallback: "Other", "General", or First in list
    if (!detectedCategory) {
        detectedCategory = allowedCategories.includes("Other") ? "Other" : allowedCategories[0];
    }

    // 5. Resolve Slug from Master List
    const masterCat = CATEGORIES.find(c => c.label === detectedCategory);
    const categorySlug = masterCat ? masterCat.id : detectedCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return {
        category: detectedCategory,
        categorySlug,
        needsReview: !masterCat // If not in master list, it definitely needs review
    };
};

module.exports = { assignCategoryAI };
