const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Shop = require('./models/Shop');
const connectDB = require('./config/db');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const deleteSeller = async () => {
    try {
        await connectDB();

        const email = 'learnify887@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(0);
        }

        console.log(`Found user: ${user.name} (${user._id})`);

        // Delete Shops owned by this user
        const deleteShops = await Shop.deleteMany({ owner: user._id });
        console.log(`Deleted ${deleteShops.deletedCount} shops.`);

        // Delete the User
        await User.findByIdAndDelete(user._id);
        console.log(`Deleted user ${user.email}.`);

        console.log('Seller deletion complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error deleting seller:', error);
        process.exit(1);
    }
};

deleteSeller();
