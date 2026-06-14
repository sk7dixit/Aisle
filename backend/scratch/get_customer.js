const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const customer = await User.findOne({ role: 'customer' });
        if (customer) {
            console.log('Found Customer:', {
                id: customer._id,
                email: customer.email,
                name: customer.name
            });
            
            // Let's reset password to 'password123' so we are absolutely sure of it
            customer.password = 'password123';
            await customer.save();
            console.log('Reset password for existing customer to: password123');
        } else {
            console.log('No customer found. Creating demo customer...');
            const newCustomer = await User.create({
                name: 'Demo Customer',
                email: 'customer@aisle.com',
                password: 'password123',
                role: 'customer',
                phone: '9876543211',
                verificationStatus: 'approved'
            });
            console.log('Created Demo Customer:', {
                email: newCustomer.email,
                password: 'password123'
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
