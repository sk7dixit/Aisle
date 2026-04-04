const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'shashwatdixit33@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User Found:');
            console.log('ID:', user._id);
            console.log('Role:', user.role);
            console.log('Verification Status:', user.verificationStatus);
            console.log('Has Face Data:', !!user.faceData);
            console.log('Face Data Length:', user.faceData ? user.faceData.length : 0);
            console.log('Shop Details:', JSON.stringify(user.shopDetails, null, 2));
        } else {
            console.log('User not found.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
