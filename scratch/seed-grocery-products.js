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
    imageUrl: String,
    brand: String,
    category: String,
    subCategory: String,
    stockStatus: String,
    description: String
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

const grocerySellerId = "6a22678de410c49988759fa5"; // XYZ seller (GROCERY_KIRANA)

const itemsToSeed = [
    {
        name: "Tata Salt",
        price: 28,
        sellingPrice: 25,
        brand: "Tata",
        category: "Groceries",
        subCategory: "Salt & Sugar",
        imageUrl: "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400",
        description: "Iodized salt for daily cooking."
    },
    {
        name: "Fortune Mustard Oil",
        price: 195,
        sellingPrice: 175,
        brand: "Fortune",
        category: "Groceries",
        subCategory: "Cooking Oils",
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
        description: "Kachi Ghani Mustard Oil."
    },
    {
        name: "Ashirvaad Atta",
        price: 290,
        sellingPrice: 260,
        brand: "Ashirvaad",
        category: "Groceries",
        subCategory: "Atta & Flours",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
        description: "Whole wheat atta."
    },
    {
        name: "Maggi 2-Minute Noodles",
        price: 180,
        sellingPrice: 160,
        brand: "Nestle",
        category: "Groceries",
        subCategory: "Noodles & Pasta",
        imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400",
        description: "Masala noodles pack of 12."
    }
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully");

        for (const item of itemsToSeed) {
            let existing = await Product.findOne({ name: item.name, seller: grocerySellerId });
            if (existing) {
                console.log(`Product already exists: ${item.name} (${existing._id})`);
            } else {
                const newProd = await Product.create({
                    ...item,
                    seller: grocerySellerId,
                    isAvailable: true,
                    isDraft: false,
                    adminStatus: 'Active',
                    stockStatus: 'AVAILABLE'
                });
                console.log(`Seeded new product: ${item.name} (${newProd._id})`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
