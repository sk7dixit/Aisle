/**
 * Migration Script: Update Shop Types to New Enum Keys
 * Run this once to migrate existing users from old shop type labels to new enum keys
 * 
 * Usage: node backend/migrations/migrateShopTypes.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const SHOP_TYPE_MIGRATIONS = {
    "Grocery": "GROCERY_KIRANA",
    "Grocery & Kirana": "GROCERY_KIRANA",
    "Grocery / Kirana": "GROCERY_KIRANA",

    "Electronics": "TECH_ACCESSORIES",
    "Electronics & Mobile": "TECH_ACCESSORIES",
    "Electronics & Tools": "ELECTRICAL_HARDWARE_AUTO",
    "Electrical, Hardware & Auto": "ELECTRICAL_HARDWARE_AUTO",

    "Medical": "PHARMACY",
    "Pharmacy": "PHARMACY",
    "Pharmacy & Medical": "PHARMACY",
    "Pharmacy / Medical Store": "PHARMACY",

    "Stationery": "STUDENT_OFFICE",
    "Stationery & Gifts": "STUDENT_OFFICE",
    "Student & Office Supplies": "STUDENT_OFFICE",

    "Fruit & Veg": "GROCERY_KIRANA",
    "Fashion & Clothing": "HOME_LIFESTYLE",
    "Home & Kitchen": "HOME_LIFESTYLE",
    "Beauty & Personal Care": "HOME_LIFESTYLE",
    "Home & Lifestyle Goods": "HOME_LIFESTYLE",

    "Bakery": "GROCERY_KIRANA",
    "Restaurants & Food": "HOME_BUSINESS",
    "Home Businesses": "HOME_BUSINESS",

    "Seasonal / Festive Store": "SEASONAL_FESTIVE",

    "General": "GROCERY_KIRANA",
    "Other": "GROCERY_KIRANA"
};

const migrateShopTypes = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔍 Finding users with old shop types...');
        const users = await User.find({
            role: 'seller',
            'shopDetails.shopType': { $exists: true }
        });

        console.log(`📊 Found ${users.length} seller users`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const user of users) {
            const oldShopType = user.shopDetails.shopType;
            const newShopType = SHOP_TYPE_MIGRATIONS[oldShopType];

            if (!newShopType) {
                console.log(`⚠️  No migration found for: "${oldShopType}" (User: ${user.email})`);
                skippedCount++;
                continue;
            }

            // Check if already migrated
            if (oldShopType === newShopType) {
                console.log(`✓  Already migrated: ${user.email} (${newShopType})`);
                skippedCount++;
                continue;
            }

            try {
                user.shopDetails.shopType = newShopType;
                await user.save();
                console.log(`✅ Migrated: ${user.email}`);
                console.log(`   ${oldShopType} → ${newShopType}`);
                migratedCount++;
            } catch (error) {
                console.error(`❌ Error migrating ${user.email}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Migrated: ${migratedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📊 Total: ${users.length}`);

        await mongoose.connection.close();
        console.log('\n✅ Migration complete. Database connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
migrateShopTypes();
