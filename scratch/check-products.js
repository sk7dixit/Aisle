const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    sellingPrice: Number,
    isAvailable: Boolean,
    isDraft: Boolean,
    adminStatus: String,
    seller: mongoose.Schema.Types.ObjectId,
    imageUrl: String
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    role: String,
    name: String,
    shopDetails: {
        shopName: String,
        shopType: String,
        shopLocation: {
            type: { type: String },
            coordinates: [Number]
        }
    }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully");

        const products = await Product.find({}).limit(10);
        console.log("SOME PRODUCTS:");
        products.forEach(p => {
            console.log(`Product: ID=${p._id}, Name="${p.name}", Price=${p.sellingPrice || p.price}, Seller=${p.seller}`);
        });

        const sellers = await User.find({ role: 'seller' }).limit(5);
        console.log("SOME SELLERS:");
        sellers.forEach(s => {
            console.log(`Seller: ID=${s._id}, Name="${s.name}", ShopName="${s.shopDetails?.shopName}", Type="${s.shopDetails?.shopType}"`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
