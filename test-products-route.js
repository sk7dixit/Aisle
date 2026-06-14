const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

const Product = require('./backend/models/Product');
const User = require('./backend/models/User');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in km
};

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const slug = "allopathic-chemist";
        const lat = 22.293022500000003;
        const lng = 73.23564449999999;
        const radiusKm = 10;
        const city = "Vadodara";

        const query = {
            categorySlug: slug,
            isAvailable: true
        };

        const products = await Product.find(query)
            .populate('shop', 'name city shopLocation isActive isOpen contactPhone')
            .populate('seller', 'phone shopDetails')
            .lean();

        console.log(`Found ${products.length} matching products before filter`);

        const filteredProducts = products.filter(product => {
            // Synthesize product.shop if missing
            if (!product.shop && product.seller) {
                product.shop = {
                    _id: product.seller._id,
                    name: product.seller.shopDetails?.shopName || 'Nearby Business',
                    city: product.seller.shopDetails?.city || 'Indore',
                    shopLocation: product.seller.shopDetails?.shopLocation,
                    isActive: true,
                    isOpen: true,
                    contactPhone: product.seller.shopDetails?.phone || product.seller.phone || '9876543210'
                };
            }

            const shop = product.shop;
            if (!shop) {
                console.log(`Product "${product.name}" has no shop or seller`);
                return false;
            }
            if (!shop.isActive) {
                console.log(`Product "${product.name}" shop is not active`);
                return false;
            }

            if (lat && lng && shop.shopLocation && shop.shopLocation.coordinates) {
                const [shopLng, shopLat] = shop.shopLocation.coordinates;
                const dist = calculateDistance(lat, lng, shopLat, shopLng);
                product.distanceKm = dist;

                console.log(`Product "${product.name}" distance: ${dist} km, shopLat=${shopLat}, shopLng=${shopLng}`);
                if (dist <= parseFloat(radiusKm)) {
                    return true;
                }
                console.log(`Product "${product.name}" is outside radius (${dist} > ${radiusKm})`);
                return false;
            }

            if (city && shop.city && shop.city.toLowerCase() !== city.toLowerCase()) {
                console.log(`Product "${product.name}" city mismatch: "${shop.city}" !== "${city}"`);
                return false;
            }

            return true;
        });

        console.log(`Found ${filteredProducts.length} products after filter`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
