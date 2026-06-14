const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const Product = require('../backend/models/Product');
const SellerProduct = require('../backend/models/SellerProduct');

const WHITELIST_EMAILS = [
    'shashwatdixit22@gmail.com',
    'shashwatdixit033@gmail.com',
    'shashwatdixit33@gmail.com',
    'learnify887@gmail.com',
    'kallbharav7065@gmail.com',
    'trinovex@gmail.com',
    'shoplens017@gmail.com'
];

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        console.log("Fetching all users...");
        const allUsers = await User.find({});
        console.log(`Fetched ${allUsers.length} total users.`);

        const toKeepIds = [];
        const toDeleteIds = [];

        allUsers.forEach(u => {
            const email = (u.email || '').toLowerCase().trim();
            
            // Check if matches whitelist
            const isWhitelisted = WHITELIST_EMAILS.some(w => email === w.toLowerCase().trim()) || 
                                  email.includes('shashwat') || 
                                  email.includes('dixit');
            
            if (isWhitelisted) {
                toKeepIds.push(u._id);
            } else {
                toDeleteIds.push(u._id);
            }
        });

        console.log(`\nDeleting ${toDeleteIds.length} fake/test users from database...`);
        const userDeleteResult = await User.deleteMany({ _id: { $in: toDeleteIds } });
        console.log(`Successfully deleted ${userDeleteResult.deletedCount} users.`);

        console.log(`\nCleaning up associated inventory products...`);
        
        // Delete items from Product collection where seller is not in the whitelist
        const productDeleteResult = await Product.deleteMany({ seller: { $nin: toKeepIds } });
        console.log(`Deleted ${productDeleteResult.deletedCount} products from 'Product' collection.`);

        // Delete items from SellerProduct collection where seller is not in the whitelist
        const sellerProductDeleteResult = await SellerProduct.deleteMany({ seller: { $nin: toKeepIds } });
        console.log(`Deleted ${sellerProductDeleteResult.deletedCount} products from 'SellerProduct' collection.`);

        console.log(`\nCleanup completed successfully!`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
