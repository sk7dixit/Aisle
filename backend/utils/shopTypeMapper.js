// Shop Type Label to Enum Key Mapper
// This ensures frontend labels match backend enum keys

const SHOP_TYPE_LABEL_TO_KEY = {
    "Grocery / Kirana": "GROCERY_KIRANA",
    "Electrical, Hardware & Auto": "ELECTRICAL_HARDWARE_AUTO",
    "Tech & Accessories": "TECH_ACCESSORIES",
    "Student & Office Supplies": "STUDENT_OFFICE",
    "Home & Lifestyle Goods": "HOME_LIFESTYLE",
    "Pharmacy / Medical Store": "PHARMACY",
    "Home Businesses": "HOME_BUSINESS",
    "Seasonal / Festive Store": "SEASONAL_FESTIVE",

    // Legacy mappings for backward compatibility
    "Grocery & Kirana": "GROCERY_KIRANA",
    "Electronics & Mobile": "TECH_ACCESSORIES",
    "Electronics & Tools": "ELECTRICAL_HARDWARE_AUTO",
    "Pharmacy & Medical": "PHARMACY",
    "Stationery & Gifts": "STUDENT_OFFICE",
    "Home & Kitchen": "HOME_LIFESTYLE",
    "Fashion & Clothing": "HOME_LIFESTYLE",
    "Beauty & Personal Care": "HOME_LIFESTYLE",
    "Restaurants & Food": "HOME_BUSINESS"
};

const mapShopTypeToKey = (label) => {
    return SHOP_TYPE_LABEL_TO_KEY[label] || "GROCERY_KIRANA";
};

module.exports = { mapShopTypeToKey, SHOP_TYPE_LABEL_TO_KEY };
