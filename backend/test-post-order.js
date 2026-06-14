const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const run = async () => {
    try {
        console.log('Logging in as customer...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'customer@aisle.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token:', token);

        console.log('Finding a seller...');
        const User = require('./models/User');
        await mongoose.connect(process.env.MONGO_URI);
        const seller = await User.findOne({ role: 'seller' });
        console.log('Found seller:', seller.name, 'ID:', seller._id);

        const Product = require('./models/Product');
        const product = await Product.findOne({ seller: seller._id });
        console.log('Found product:', product ? product.name : 'No product found', 'ID:', product ? product._id : 'null');

        const items = [
            {
                productId: product ? product._id : new mongoose.Types.ObjectId(),
                name: product ? product.name : 'Test Product',
                quantity: 1,
                price: '100'
            }
        ];

        console.log('Sending create order request to backend...');
        const orderRes = await axios.post('http://localhost:5000/api/customer/orders', {
            sellerId: seller._id.toString(),
            items,
            paymentMode: 'PAY_ON_VISIT',
            visitDate: '2026-06-15',
            visitTime: '12:00'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Order response status:', orderRes.status);
        console.log('Order response data:', orderRes.data);

        process.exit(0);
    } catch (err) {
        if (err.response) {
            console.error('Error status:', err.response.status);
            console.error('Error data:', err.response.data);
        } else {
            console.error('Error message:', err.message);
        }
        process.exit(1);
    }
};

run();
