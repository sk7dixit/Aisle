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
        const count = await User.countDocuments({});
        console.log(`Total Users Count: ${count}`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in Database:', collections.map(c => c.name));

        const sellers = await User.find({}).select('name email role');
        if (sellers.length > 0) {
            console.log('ALL EXISTING USERS:');
            sellers.forEach(s => {
                console.log(`- Email: ${s.email} | Role: ${s.role} | Name: ${s.name}`);
            });
        } else {
            console.log('No sellers found. Creating demo seller...');
            const newSeller = await User.create({
                name: 'Demo Seller',
                email: 'seller@aisle.com',
                password: 'password123',
                role: 'seller',
                phone: '1234567890',
                verificationStatus: 'approved',
                shopDetails: {
                    shopName: 'Demo Shop',
                    address: '123 Market St',
                    shopCategory: 'General',
                    shopType: 'GROCERY_KIRANA'
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
