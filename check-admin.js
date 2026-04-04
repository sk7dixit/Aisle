const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./backend/models/User');

dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const admin = await User.findOne({ email: 'shoplens017@gmail.com' });
        if (admin) {
            console.log('Admin user found:', admin.email, admin.role);
        } else {
            console.log('Admin user NOT found');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmin();
