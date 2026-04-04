const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ShopCategory = require('../models/ShopCategory');

dotenv.config();

const categories = [
    { name: 'Grocery / Kirana', description: 'Daily essentials, food, and household items.' },
    { name: 'Electronics & Tools', description: 'Gadgets, appliances, and repair tools.' },
    { name: 'Tech & Accessories', description: 'Computers, mobiles, and digital accessories.' },
    { name: 'Student & Office Supplies', description: 'Books, stationery, and office equipment.' },
    { name: 'Home & Lifestyle Goods', description: 'Furniture, decor, and personal care.' },
    { name: 'Pharmacy / Medical Store', description: 'Medicines and health supplies.' },
    { name: 'Home Businesses', description: 'Handmade goods and small home-run ventures.' },
    { name: 'Seasonal / Festive Store', description: 'Items for festivals and special occasions.' },
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await ShopCategory.deleteMany(); // Clear existing
        await ShopCategory.insertMany(categories);

        console.log('Categories seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();
