
// STRICT ADMIN-DEFINED TAXONOMY
// This is the Single Source of Truth for the Customer App.
// Do NOT mix with Landing Page marketing categories.

import {
    FaShoppingBasket,
    FaBreadSlice,
    FaMobileAlt,
    FaPumpSoap,
    FaPrescriptionBottleAlt,
    FaTools,
    FaPen,
    FaGift
} from 'react-icons/fa';

export const CUSTOMER_CATEGORIES = [
    {
        id: 'grocery',
        label: 'Grocery & Staples',
        subcategories: ['Atta', 'Rice', 'Dals', 'Spices', 'Oil', 'Dry Fruits'],
        icon: FaShoppingBasket,
        color: 'text-green-500',
        bg: 'bg-green-50'
    },
    {
        id: 'dairy',
        label: 'Dairy & Bakery',
        subcategories: ['Milk', 'Curd', 'Paneer', 'Bread', 'Eggs', 'Butter'],
        icon: FaBreadSlice,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50'
    },
    {
        id: 'mobile',
        label: 'Mobile Accessories',
        subcategories: ['Cables', 'Chargers', 'Cases', 'Screen Guards', 'Headphones'],
        icon: FaMobileAlt,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50'
    },
    {
        id: 'daily',
        label: 'Daily Essentials',
        subcategories: ['Soaps', 'Shampoos', 'Detergents', 'Cleaning', 'Toothpaste'],
        icon: FaPumpSoap,
        color: 'text-cyan-500',
        bg: 'bg-cyan-50'
    },
    {
        id: 'medicine',
        label: 'Medicines',
        subcategories: ['First Aid', 'Supplements', 'OTC', 'Prescription'],
        icon: FaPrescriptionBottleAlt,
        color: 'text-blue-500',
        bg: 'bg-blue-50'
    },
    {
        id: 'kitchen',
        label: 'Kitchenware',
        subcategories: ['Utensils', 'Tools', 'Storage', 'Bottles'],
        icon: FaTools,
        color: 'text-orange-500',
        bg: 'bg-orange-50'
    },
    {
        id: 'stationery',
        label: 'Stationery',
        subcategories: ['Notebooks', 'Pens', 'Office', 'School', 'Art'],
        icon: FaPen,
        color: 'text-purple-500',
        bg: 'bg-purple-50'
    },
    {
        id: 'gifts',
        label: 'Gifts & Toys',
        subcategories: ['Toys', 'Games', 'Decor', 'Cards'],
        icon: FaGift,
        color: 'text-pink-500',
        bg: 'bg-pink-50'
    }
];

export const getCategoryById = (id) => {
    return CUSTOMER_CATEGORIES.find(c => c.id === id);
};
