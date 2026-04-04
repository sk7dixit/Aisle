const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const shopsData = [
    {
        email: 'grocery@shoplens.com',
        name: 'Vikas Provisions',
        shopName: 'Vikas Provisions & General Store',
        shopCategory: 'Grocery / Kirana',
        address: 'Shop 4, Market Complex, New Delhi',
        location: { lat: 28.6139, lng: 77.2090 },
        products: [
            { name: 'Tata Salt 1kg', price: 28, category: 'Daily Essentials', imageUrl: 'https://images.unsplash.com/photo-1626082896492-766af4eb6501?auto=format&fit=crop&w=400&q=80' },
            { name: 'Fortune Sunflower Oil 1L', price: 145, category: 'Oil & Spices', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbadcbaf?auto=format&fit=crop&w=400&q=80' },
            { name: 'Aashirvaad Shudh Chakki Atta 5kg', price: 265, category: 'Grains & Pulses', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
            { name: 'Maggi 2-Minute Noodles 280g', price: 56, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe9307f154d?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        email: 'electronics@shoplens.com',
        name: 'Modern Electricals',
        shopName: 'Modern Electricals & Hardware',
        shopCategory: 'Electronics & Tools',
        address: 'G-12, Heritage Plaza, New Delhi',
        location: { lat: 28.6150, lng: 77.2100 },
        products: [
            { name: 'Philips 9W LED Bulb', price: 120, category: 'Lighting', imageUrl: 'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=400&q=80' },
            { name: 'Taparia Screw Driver Set', price: 350, category: 'Tools', imageUrl: 'https://images.unsplash.com/photo-1530124560676-41bc1275d4d6?auto=format&fit=crop&w=400&q=80' },
            { name: 'Havells 3-Pin Multi Plug', price: 180, category: 'Electrical', imageUrl: 'https://images.unsplash.com/photo-1558444479-274e40283f6f?auto=format&fit=crop&w=400&q=80' },
            { name: 'Finolex 1.5sqmm Wire 90m', price: 1250, category: 'Wires', imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        email: 'tech@shoplens.com',
        name: 'Pixel Tech',
        shopName: 'Pixel Tech Hub',
        shopCategory: 'Tech & Accessories',
        address: '2nd Floor, Grand Mall, New Delhi',
        location: { lat: 28.6100, lng: 77.2000 },
        products: [
            { name: 'boAt Rockerz 255 Pro+', price: 1299, category: 'Audio', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
            { name: 'Mi 10000mAh Power Bank', price: 1199, category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1609592424109-ddbd1654c30c?auto=format&fit=crop&w=400&q=80' },
            { name: 'SanDisk 64GB Pendrive', price: 450, category: 'Storage', imageUrl: 'https://images.unsplash.com/photo-1585338663421-d70377045bca?auto=format&fit=crop&w=400&q=80' },
            { name: 'Ambrane Type-C Cable', price: 199, category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        email: 'stationery@shoplens.com',
        name: 'Campus Books',
        shopName: 'Campus Books & Stationery',
        shopCategory: 'Student & Office Supplies',
        address: 'Opp. University Gate, New Delhi',
        location: { lat: 28.6200, lng: 77.2150 },
        products: [
            { name: 'Classmate Long Notebook', price: 65, category: 'Notebooks', imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=400&q=80' },
            { name: 'Parker Frontier Matte black Pen', price: 550, category: 'Writing', imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
            { name: 'Casio Scientific Calculator', price: 1195, category: 'Office Supplies', imageUrl: 'https://images.unsplash.com/photo-1574607383476-f517f220d35b?auto=format&fit=crop&w=400&q=80' },
            { name: 'Fevicol MR 50g', price: 25, category: 'Office Supplies', imageUrl: 'https://images.unsplash.com/photo-1610433130635-c34444983086?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        email: 'lifestyle@shoplens.com',
        name: 'Curated Living',
        shopName: 'Curated Living - Home Decor',
        shopCategory: 'Home & Lifestyle Goods',
        address: 'Main Road, Akota, New Delhi',
        location: { lat: 28.6180, lng: 77.2050 },
        products: [
            { name: 'Decorative Scented Candle', price: 350, category: 'Decor', imageUrl: 'https://images.unsplash.com/photo-1602872030219-aa5788f01f01?auto=format&fit=crop&w=400&q=80' },
            { name: 'Macramé Wall Hanging', price: 850, category: 'Wall Art', imageUrl: 'https://images.unsplash.com/photo-1616137422495-1e902dd3ce42?auto=format&fit=crop&w=400&q=80' },
            { name: 'Ceramic Table Planter', price: 499, category: 'Indoor Plants', imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d445?auto=format&fit=crop&w=400&q=80' },
            { name: 'Designer Throw Pillow', price: 650, category: 'Furnishing', imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        email: 'medical@shoplens.com',
        name: 'LifeLine Medicose',
        shopName: 'LifeLine Medicose & Wellness',
        shopCategory: 'Pharmacy / Medical Store',
        address: 'Ground Floor, City Tower, New Delhi',
        location: { lat: 28.6080, lng: 77.2180 },
        products: [
            { name: 'Dettol Antiseptic 250ml', price: 115, category: 'First Aid', imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=400&q=80' },
            { name: 'Himalaya Hand Sanitizer', price: 50, category: 'Hygiene', imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&q=80' },
            { name: 'Digital Thermometer', price: 220, category: 'Diagnostics', imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=400&q=80' },
            { name: 'Dr. Morepen Glucose Monitor', price: 850, category: 'Diagnostics', imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        email: 'handmade@shoplens.com',
        name: 'Asha’s Kitchen',
        shopName: 'Asha’s Kitchen - Handmade Delights',
        shopCategory: 'Home Businesses',
        address: 'C-402, Sunshine Residency, New Delhi',
        location: { lat: 28.6145, lng: 77.2110 },
        products: [
            { name: 'Handmade Mango Pickle 500g', price: 250, category: 'Pickles', imageUrl: 'https://images.unsplash.com/photo-1589135325565-d60232230b0b?auto=format&fit=crop&w=400&q=80' },
            { name: 'Organic Turmeric Powder 200g', price: 120, category: 'Spices', imageUrl: 'https://images.unsplash.com/photo-1615485240314-1e582855167b?auto=format&fit=crop&w=400&q=80' },
            { name: 'Homemade Wheat Papad 200g', price: 80, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1626082896492-766af4eb6501?auto=format&fit=crop&w=400&q=80' },
            { name: 'Masala Chai Mix 100g', price: 150, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1594631252845-29fc458695d1?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        email: 'festive@shoplens.com',
        name: 'Utsav Celebrations',
        shopName: 'Utsav Celebrations & Gift Shop',
        shopCategory: 'Seasonal / Festive Store',
        address: 'Sagar Complex, Lane 5, New Delhi',
        location: { lat: 28.6250, lng: 77.2000 },
        products: [
            { name: 'Decorative Hand-painted Diyas', price: 150, category: 'Festive', imageUrl: 'https://images.unsplash.com/photo-1573483569853-2479e0066fba?auto=format&fit=crop&w=400&q=80' },
            { name: 'Rangoli Color Set (10 colors)', price: 200, category: 'Festive', imageUrl: 'https://images.unsplash.com/photo-1541014529321-72993809cb9f?auto=format&fit=crop&w=400&q=80' },
            { name: 'Marigold Garland (Artificial)', price: 99, category: 'Decor', imageUrl: 'https://images.unsplash.com/photo-1590004953392-5aba2e7859d3?auto=format&fit=crop&w=400&q=80' },
            { name: 'Premium Puja Thali Set', price: 450, category: 'Puja Essentials', imageUrl: 'https://images.unsplash.com/photo-1590004953392-5aba2e7859d3?auto=format&fit=crop&w=400&q=80' }
        ]
    }
];

const seedShops = async () => {
    await connectDB();

    try {
        console.log('Wiping existing data...');
        // Only wipe sellers and their products to avoid breaking customer accounts
        const sellers = await User.find({ role: 'seller' });
        const sellerIds = sellers.map(s => s._id);

        await Product.deleteMany({ seller: { $in: sellerIds } });
        await User.deleteMany({ role: 'seller' });

        console.log('Seeding new shops...');

        for (const shopInfo of shopsData) {
            const seller = await User.create({
                name: shopInfo.name,
                email: shopInfo.email,
                password: 'password123',
                role: 'seller',
                shopDetails: {
                    shopName: shopInfo.shopName,
                    shopCategory: shopInfo.shopCategory,
                    address: shopInfo.address,
                    location: shopInfo.location,
                    isOpen: true,
                    declarationAccepted: true,
                    photos: [shopInfo.products[0].imageUrl]
                },
                sellerStats: {
                    lastActiveAt: new Date()
                }
            });

            const productsToInsert = shopInfo.products.map(p => ({
                ...p,
                seller: seller._id,
                description: `High quality ${p.name} available at ${shopInfo.shopName}`,
                stockStatus: 'AVAILABLE',
                isExact: true,
                countInStock: 50,
                imageUrl: p.imageUrl
            }));

            await Product.insertMany(productsToInsert);
            console.log(`- Seeded ${shopInfo.shopName} with ${productsToInsert.length} products`);
        }

        console.log('Seeding Complete! 🎉');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedShops();
