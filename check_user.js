const mongoose = require('mongoose');
const User = require('./backend/models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'shashwatdixit33@gmail.com' });
        if (user) {
            console.log(`User found: ${user.name} (${user.role}) ID: ${user._id}`);
            console.log(`Shop: ${JSON.stringify(user.shopDetails)}`);
        } else {
            console.log('User shashwatdixit33@gmail.com NOT FOUND');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUser();
