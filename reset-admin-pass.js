const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./backend/models/User');

dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const admin = await User.findOne({ email: 'shoplens017@gmail.com' });
        if (admin) {
            console.log('Admin found. Updating password...');
            // Check if matchPassword works with plain text assignment
            // In User model pre-save hook usually handles hashing.
            // We need to fetch the document and save it to trigger pre-save.

            admin.password = 'Admin@123';
            await admin.save();

            console.log('Password updated successfully for:', admin.email);
        } else {
            console.log('Admin user NOT found. Creating one...');
            await User.create({
                name: 'Super Admin',
                email: 'shoplens017@gmail.com',
                password: 'Admin@123',
                role: 'admin',
                phone: '9999999999'
            });
            console.log('Admin created.');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetAdminPassword();
