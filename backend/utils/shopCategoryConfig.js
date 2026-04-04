const SHOP_Types = {
    GROCERY_KIRANA: 'GROCERY_KIRANA',
    ELECTRICAL_HARDWARE_AUTO: 'ELECTRICAL_HARDWARE_AUTO',
    TECH_ACCESSORIES: 'TECH_ACCESSORIES',
    STUDENT_OFFICE: 'STUDENT_OFFICE',
    HOME_LIFESTYLE: 'HOME_LIFESTYLE',
    PHARMACY: 'PHARMACY',
    HOME_BUSINESS: 'HOME_BUSINESS',
    SEASONAL_FESTIVE: 'SEASONAL_FESTIVE',
    SERVICES: 'SERVICES'
};

const SHOP_CATEGORIES = {
    [SHOP_Types.GROCERY_KIRANA]: [
        'General Provision / Kirana',
        'Fruits & Vegetables',
        'Dairy & Ice Cream',
        'Bakery & Cake Shop',
        'Snacks & Beverages',
        'Household Essentials'
    ],
    [SHOP_Types.PHARMACY]: [
        'Medicines',
        'Health Supplements',
        'First Aid',
        'Personal Care',
        'Baby Care'
    ],
    [SHOP_Types.STUDENT_OFFICE]: [
        'Notebooks & Registers',
        'Pens & Writing',
        'Art & Craft',
        'Office Supplies'
    ],
    [SHOP_Types.TECH_ACCESSORIES]: [
        'Mobile Accessories',
        'Computer Parts',
        'Audio & Headphones',
        'Cables & Chargers'
    ],
    [SHOP_Types.ELECTRICAL_HARDWARE_AUTO]: [
        'Electrical Items',
        'Hardware & Tools',
        'Paints & Decor',
        'Auto Parts'
    ],
    [SHOP_Types.HOME_LIFESTYLE]: [
        'Kitchenware',
        'Bath & Cleaning',
        'Home Decor',
        'Gifting Items'
    ],
    [SHOP_Types.HOME_BUSINESS]: [
        'Home Cooked Food',
        'Handmade Crafts',
        'Small Batch Products'
    ],
    [SHOP_Types.SEASONAL_FESTIVE]: [
        'Festival Specific',
        'Crackers & Fireworks',
        'Winter / Rain Gear'
    ],
    [SHOP_Types.SERVICES]: [
        'Plumbing & Electrical',
        'Cleaning Services',
        'Beauty & Salon',
        'Maintenance'
    ]
};

// Helper to get categories for a shop type
const getCategoriesForShop = (shopType) => {
    return SHOP_CATEGORIES[shopType] || ['General'];
};

module.exports = {
    SHOP_Types,
    SHOP_CATEGORIES,
    getCategoriesForShop
};
