
const mongoose = require('mongoose');
const User = require('./models/User');
const { resolveShopCategory } = require('./config/categoryConfig');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const migrateSellers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const sellers = await User.find({ role: 'seller' });
        console.log(`Found ${sellers.length} sellers. Starting migration...`);

        for (const seller of sellers) {
            if (seller.shopDetails) {
                const category = seller.shopDetails.category || seller.shopDetails.shopCategory || 'Other';
                const customInput = seller.shopDetails.customCategoryInput || null;

                const { resolvedKey, allowedSubCategories } = resolveShopCategory(category, customInput);

                console.log(`Migrating ${seller.email}: ${category} -> ${resolvedKey}`);

                // Direct update to ensure schema validation doesn't block unrelated things if any
                seller.shopDetails.resolvedCategoryKey = resolvedKey;
                seller.shopDetails.allowedSubCategories = allowedSubCategories;

                await seller.save();
            }
        }

        console.log('Migration completed successfully.');
        mongoose.disconnect();
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
};

migrateSellers();
