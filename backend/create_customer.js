const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const createCustomer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            tls: true,
            tlsAllowInvalidCertificates: true
        });
        console.log('MongoDB Connected');

        const email = 'customer@shoplens.com';
        const password = 'password123';

        // Check if exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists. Updating password...');
            user.password = password; // Will be hashed by pre-save hook
            user.role = 'customer'; // Ensure role
            await user.save();
            console.log('User updated.');
        } else {
            console.log('Creating new customer...');
            user = await User.create({
                name: 'Test Customer',
                email,
                password,
                role: 'customer',
                phone: '9999999999',
                verificationStatus: 'approved'
            });
            console.log('User created.');
        }

        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createCustomer();
