const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            tls: true,
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 5000,
            family: 4
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkUserImages = async () => {
    await connectDB();
    try {
        const user = await User.findOne({ email: 'shashwatdixit33@gmail.com' });
        if (user) {
            console.log('User found:', user.email);
            console.log('Shop Details:', JSON.stringify(user.shopDetails, null, 2));
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

checkUserImages();
