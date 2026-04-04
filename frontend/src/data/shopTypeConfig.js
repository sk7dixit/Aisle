export const SHOP_TYPE_CONFIG = {
    // 1. GROCERY / KIRANA
    "Grocery / Kirana": {
        label: "Grocery & Kirana",
        allowedCategories: [
            {
                categoryId: "daily_essentials",
                label: "Daily Essentials",
                subcategories: ["Rice & Wheat (Atta)", "Dals & Pulses", "Oil & Ghee", "Salt, Sugar & Jaggery", "Spices (Masala)"]
            },
            {
                categoryId: "dairy_bakery",
                label: "Dairy & Bakery",
                subcategories: ["Milk & Curd", "Bread & Eggs", "Paneer & Butter", "Biscuits & Rusk"]
            },
            {
                categoryId: "snacks_beverages",
                label: "Snacks & Beverages",
                subcategories: ["Chips & Namkeen", "Cold Drinks & Juices", "Tea & Coffee", "Chocolates & Candies"]
            },
            {
                categoryId: "household",
                label: "Household Care",
                subcategories: ["Detergents & Soaps", "Cleaners & Disinfectants", "Pooja Needs"]
            },
            {
                categoryId: "personal_care",
                label: "Personal Care",
                subcategories: ["Soaps & Body Wash", "Shampoo & Hair Oil", "Toothpaste & Brush", "Creams & Lotions"]
            }
        ]
    },

    // 2. ELECTRONICS & TOOLS (Utility Sector)
    "Electronics & Tools": {
        label: "Electronics & Tools",
        allowedCategories: [
            {
                categoryId: "electrical_supplies",
                label: "Electrical Supplies",
                subcategories: ["Wires & Cables", "Switches & Sockets", "Bulbs & Tubelights", "Extension Boards"]
            },
            {
                categoryId: "hardware_tools",
                label: "Hardware & Tools",
                subcategories: ["Screwdrivers & Pliers", "Hammers & Wrenches", "Drill Bits & Nails", "Tapes & Adhesives"]
            },
            {
                categoryId: "small_appliances",
                label: "Small Appliances",
                subcategories: ["Irons", "Kettles", "Fans", "Trimmers"]
            }
        ]
    },

    // 3. TECH & ACCESSORIES (Mobile/Computer focus)
    "Tech & Accessories": {
        label: "Tech & Accessories",
        allowedCategories: [
            {
                categoryId: "mobile_accessories",
                label: "Mobile Accessories",
                subcategories: ["Chargers & Cables", "Earphones & Headphones", "Screen Guards", "Mobile Cases"]
            },
            {
                categoryId: "computer_peripherals",
                label: "Computer Peripherals",
                subcategories: ["Mouse & Keyboards", "Pen Drives & SD Cards", "Laptop Sleeves", "Cables (HDMI/VGA)"]
            },
            {
                categoryId: "smart_gadgets",
                label: "Smart Gadgets",
                subcategories: ["Smart Watches", "Bluetooth Speakers", "Power Banks"]
            }
        ]
    },

    // 4. STUDENT & OFFICE SUPPLIES (Stationery)
    "Student & Office Supplies": {
        label: "Student & Office Supplies",
        allowedCategories: [
            {
                categoryId: "notebooks_paper",
                label: "Notebooks & Paper",
                subcategories: ["Notebooks (Long/Short)", "A4 Paper", "Diaries & Planners", "Drawing Books"]
            },
            {
                categoryId: "writing_instruments",
                label: "Writing Instruments",
                subcategories: ["Pens (Ball/Gel)", "Pencils & Erasers", "Markers & Highlighters", "Geometry Boxes"]
            },
            {
                categoryId: "art_craft",
                label: "Art & Craft",
                subcategories: ["Paints & Brushes", "Craft Paper", "Adhesives & Glues", "Scissors & Cutters"]
            },
            {
                categoryId: "office_essentials",
                label: "Office Essentials",
                subcategories: ["Files & Folders", "Staplers & Punch", "Calculators", "Desk Organizers"]
            }
        ]
    },

    // 5. HOME & LIFESTYLE (Gifts, Decor, Utensils)
    "Home & Lifestyle Goods": {
        label: "Home & Lifestyle Goods",
        allowedCategories: [
            {
                categoryId: "kitchenware",
                label: "Kitchenware",
                subcategories: ["Cookware (Pans/Tawas)", "Utensils & Cutlery", "Containers & Bottles", "Kitchen Tools"]
            },
            {
                categoryId: "home_decor",
                label: "Home Decor",
                subcategories: ["Clocks & Photo Frames", "Vases & Artificial Flowers", "Candles & Fragrances", "Wall Hangings"]
            },
            {
                categoryId: "gifts_toys",
                label: "Gifts & Toys",
                subcategories: ["Gift Sets", "Soft Toys", "Board Games", "Greeting Cards"]
            }
        ]
    },

    // 6. PHARMACY (Strict subset, minimal)
    "Pharmacy / Medical Store": {
        label: "Pharmacy & Wellness",
        allowedCategories: [
            {
                categoryId: "health_wellness",
                label: "Health & Wellness",
                subcategories: ["Vitamins & Supplements", "First Aid & Bandages", "Masks & Sanitizers", "Thermometers"]
            },
            {
                categoryId: "baby_care",
                label: "Baby Care",
                subcategories: ["Diapers & Wipes", "Baby Food", "Baby Oil & Lotion"]
            },
            {
                categoryId: "personal_hygiene",
                label: "Personal Hygiene",
                subcategories: ["Adult Diapers", "Sanitary Pads", "Cotton & Swabs"]
            }
        ]
    },

    // 7. SEASONAL
    "Seasonal / Festive Store": {
        label: "Seasonal & Festive",
        allowedCategories: [
            {
                categoryId: "festive_decor",
                label: "Festive Decor",
                subcategories: ["Lights & Diyas", "Colors (Rangoli/Holi)", "Rakhi & Threads", "Idols & Pooja Items"]
            },
            {
                categoryId: "seasonal_essentials",
                label: "Seasonal Essentials",
                subcategories: ["Umbrellas & Raincoats", "Winter Wear (Caps/Gloves)", "Summer Coolers"]
            }
        ]
    },

    // 8. OTHER (Fallback, restricted but flexible)
    "Other": {
        label: "General Store",
        allowedCategories: [
            {
                categoryId: "general_items",
                label: "General Items",
                subcategories: ["General Supplies", "Miscellaneous"]
            }
        ]
    }
};

export const getSellerConfig = (shopType) => {
    // Normalize string to match keys if needed, or exact match
    const config = SHOP_TYPE_CONFIG[shopType];
    if (!config) {
        console.warn(`Shop Type config not found for: ${shopType}, falling back to Other`);
        return SHOP_TYPE_CONFIG["Other"];
    }
    return config;
};

export const getAllowedCategories = (shopType) => {
    return getSellerConfig(shopType).allowedCategories;
};
