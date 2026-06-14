const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Adjust path to find .env from backend folder or root
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');

const run = async () => {
    try {
        await connectDB();

        // Wait a moment for connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Searching for sellers...');
        const sellers = await User.find({ role: 'seller' });

        if (sellers.length > 0) {
            sellers.forEach(s => {
                console.log(`Email: ${s.email}`);
                // Password is hashed, so we can't show it.
            });
            console.log('---------------------');
            console.log('If you recall your password, use the email above.');
            console.log('If not, I can reset it to "password123".');
        } else {
            console.log('No sellers found. Creating demo seller...');
            const newSeller = await User.create({
                name: 'Demo Seller',
                email: 'seller@aisle.com',
                password: 'password123',
                role: 'seller',
                phone: '9876543210',
                verificationStatus: 'approved',
                shopDetails: {
                    shopName: 'Demo Shop',
                    address: 'Test Address',
                    shopCategory: 'Electronics',
                    shopType: 'online'
                }
            });
            console.log('--- CREATED SELLER ---');
            console.log(`Email: ${newSeller.email}`);
            console.log('Password: password123');
            console.log('----------------------');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
