const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'shoplens017@gmail.com';
        const adminPassword = 'Admin@123';

        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const admin = await User.create({
            name: 'ShopLens Admin',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            verificationStatus: 'approved',
            phone: '0000000000' // Placeholder as it might be required by schema validation someday, though currently optional
        });

        console.log(`Admin user created successfully: ${admin.email}`);
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createAdmin();
