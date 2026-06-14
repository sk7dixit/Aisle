const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Project = require('./models/Product'); // Ensure Product model is imported if not already

const seedSeller = async () => {
    await connectDB();

    try {
        console.log('Seeding Data...');
        // 1. Create/Update Seller
        let seller = await User.findOne({ email: 'seller@test.com' });
        const shopData = {
            shopName: 'Green Valley Grocers',
            address: '123 Market Street, Block B',
            phone: '9876543210',
            shopCategory: 'Groceries',
            shopType: 'GROCERY_KIRANA', // New Field
            openingHours: '8:00 AM - 10:30 PM',
            location: { lat: 28.6139, lng: 77.2090 },
            declarationAccepted: true,
            isOpen: true,
            photos: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80']
        };

        if (seller) {
            console.log('Updating existing seller...');
            seller.shopDetails = shopData;
            seller.phone = '9876543210';
            seller.verificationStatus = 'approved';
            await seller.save();
        } else {
            console.log('Creating new seller...');
            seller = await User.create({
                name: 'Test Seller',
                email: 'seller@test.com',
                password: 'password123',
                phone: '9876543210',
                role: 'seller',
                shopDetails: shopData,
                verificationStatus: 'approved'
            });
        }

        // 2. Create Products for this Shop
        const Product = require('./models/Product');

        console.log('Clearing old products...');
        await Product.deleteMany({ seller: seller._id });

        const products = [
            { name: 'Tata Salt 1kg', category: 'General Provision / Kirana', categorySlug: 'general-provision', subCategory: 'Salt', mrp: 25, sellingPrice: 20, shopType: 'GROCERY_KIRANA', stockStatus: 'IN_STOCK', quantity: 50 },
            { name: 'Aashirvaad Atta 5kg', category: 'General Provision / Kirana', categorySlug: 'general-provision', subCategory: 'Atta', mrp: 300, sellingPrice: 240, shopType: 'GROCERY_KIRANA', stockStatus: 'IN_STOCK', quantity: 20 },
            { name: 'Fortune Oil 1L', category: 'General Provision / Kirana', categorySlug: 'general-provision', subCategory: 'Oil', mrp: 180, sellingPrice: 150, shopType: 'GROCERY_KIRANA', stockStatus: 'IN_STOCK', quantity: 30 }
        ];

        console.log('Inserting new products...');
        await Product.insertMany(products.map(p => ({
            ...p,
            seller: seller._id,
            description: 'Standard item',
            packSize: 'Standard'
        })));

        console.log('Seeding Complete');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedSeller();
