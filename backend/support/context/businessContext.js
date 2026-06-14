const BUSINESS_TYPES = {
    GROCERY_KIRANA: {
        key: 'GROCERY_KIRANA',
        label: 'Grocery / Kirana',
        trendingProducts: ["Milk", "Bread", "Paneer", "Rice", "Oil", "Curd"],
        demands: ["Organic Honey", "Brown Bread", "Fresh Paneer", "Fresh Curd"],
        isService: false
    },
    ELECTRONICS_TOOLS: {
        key: 'ELECTRONICS_TOOLS',
        label: 'Electrical, Hardware & Auto',
        trendingProducts: ["USB Cable", "Extension Board", "Power Bank", "Earphones", "Bluetooth Speaker"],
        demands: ["USB-C Adapter", "Smart LED Bulb", "HDMI Cable", "Screwdriver Set"],
        isService: false
    },
    TECH_ACCESSORIES: {
        key: 'TECH_ACCESSORIES',
        label: 'Tech & Accessories',
        trendingProducts: ["USB Cable", "Power Bank", "Earphones", "Bluetooth Speaker", "Tempered Glass"],
        demands: ["Wireless Mouse", "Laptop Stand", "Phone Charger Case", "Camera Lens Guard"],
        isService: false
    },
    STUDENT_OFFICE: {
        key: 'STUDENT_OFFICE',
        label: 'Student & Office Supplies',
        trendingProducts: ["Notebooks", "Pens", "Files", "Sticky Notes", "Calculators"],
        demands: ["Gel Pens (Pack)", "Exam Pads", "Highlighters", "Desk Organizers"],
        isService: false
    },
    HOME_LIFESTYLE: {
        key: 'HOME_LIFESTYLE',
        label: 'Home & Lifestyle Goods',
        trendingProducts: ["Kitchen Container Set", "Cleaners", "Cosmetics", "Bedsheets", "Footwear"],
        demands: ["Yoga Mat", "Storage Boxes", "Sunscreen SPF 50", "Throw Pillows"],
        isService: false
    },
    PHARMACY_MEDICAL: {
        key: 'PHARMACY_MEDICAL',
        label: 'Pharmacy / Medical Store',
        trendingProducts: ["Vitamin Supplements", "Hand Sanitizer", "Face Masks", "Protein Powder", "Health Drinks"],
        demands: ["Cold & Flu Medicines", "Cough Syrup", "Pain Relief Spray", "Multivitamins"],
        isService: false
    },
    SERVICES: {
        key: 'SERVICES',
        label: 'Services / Bookings',
        trendingProducts: ["Standard AC Service", "Deep Cleaning Package", "Full House Electrical Check", "Haircut & Grooming Service"],
        demands: ["AC Gas Refill", "Urgent Plumbing Repair", "Sofa Dry Cleaning", "Car Washing Service"],
        isService: true
    },
    HOME_BUSINESS: {
        key: 'HOME_BUSINESS',
        label: 'Home Businesses',
        trendingProducts: ["Homemade Pickles", "Bakery Products", "Tiffin Plans", "Gift Hampers"],
        demands: ["Chocolate Gift Box", "Mango Pickle Jar", "Daily Lunch Tiffin", "Sourdough Bread"],
        isService: false
    },
    SEASONAL_FESTIVE: {
        key: 'SEASONAL_FESTIVE',
        label: 'Seasonal / Festive Store',
        trendingProducts: ["Diwali Lights", "Gift Packs", "Decorations", "Rain Gear", "Rakhi Packs"],
        demands: ["Clay Diyas", "LED String Lights", "Dry Fruit Hampers", "Umbrellas"],
        isService: false
    },
    OTHER: {
        key: 'OTHER',
        label: 'General / Other',
        trendingProducts: ["General Item A", "General Item B", "General Item C"],
        demands: ["General Demand X", "General Demand Y"],
        isService: false
    }
};

const getNormalizedShopType = (shopType) => {
    if (!shopType) return 'GROCERY_KIRANA';
    const upper = shopType.toUpperCase();
    if (upper === 'PHARMACY') return 'PHARMACY_MEDICAL';
    if (upper === 'ELECTRICAL_HARDWARE_AUTO' || upper === 'ELECTRICAL_HARDWARE_AUTO') return 'ELECTRONICS_TOOLS';
    if (BUSINESS_TYPES[upper]) return upper;
    
    // Check key containing
    for (const key of Object.keys(BUSINESS_TYPES)) {
        if (key.includes(upper) || upper.includes(key)) {
            return key;
        }
    }
    return 'OTHER';
};

module.exports = {
    BUSINESS_TYPES,
    getNormalizedShopType
};
