require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            tls: true,
            tlsAllowInvalidCertificates: true,
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Connection Error:', error.message);
        process.exit(1);
    }
};

const findOrCreateSeller = async () => {
    await connectDB();
    try {
        const sellers = await User.find({ role: 'seller' }).select('name email');

        if (sellers.length > 0) {
            console.log('FOUND EXISTING SELLERS:');
            sellers.forEach(s => {
                console.log(`- Email: ${s.email} (Password: User defined)`);
            });
            console.log('If you do not know the password, I can reset it for you.');
        } else {
            console.log('No sellers found. Creating demo seller...');
            const newSeller = await User.create({
                name: 'Demo Seller',
                email: 'seller@shoplens.com',
                password: 'password123',
                role: 'seller',
                phone: '1234567890',
                verificationStatus: 'approved',
                shopDetails: {
                    shopName: 'Demo Shop',
                    address: '123 Market St',
                    shopCategory: 'General',
                    shopType: 'physical'
                }
            });
            console.log('CREATED NEW SELLER:');
            console.log(`- Email: ${newSeller.email}`);
            console.log(`- Password: password123`);
        }
    } catch (error) {
        console.error('Error in operation:', error);
    } finally {
        mongoose.disconnect();
    }
};

findOrCreateSeller();
