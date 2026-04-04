const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Shop = require('../models/Shop'); // Ensure you have this model
const { calculateDistance } = require('../utils/distance'); // Helper needed
const CATEGORIES = require('../config/categories');

// GET /api/categories
// Returns the master list of categories
router.get('/', (req, res) => {
    res.json(CATEGORIES);
});

// GET /api/categories/:slug/products
// Returns products for a specific category, filtered by location
router.get('/:slug/products', async (req, res) => {
    try {
        const { slug } = req.params;
        const { lat, lng, city, radiusKm = 5 } = req.query;

        // 1. Validate Category
        const categoryExists = CATEGORIES.some(c => c.id === slug);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // 2. Find Active Products in this Category
        // We populate 'shop' to get location data
        const query = {
            categorySlug: slug,
            isAvailable: true,
            // adminStatus: 'Active' // Uncomment if strictly enforcing
        };

        const products = await Product.find(query)
            .populate('shop', 'name city shopLocation isActive isOpen') // Select specific fields
            .lean();

        // 3. Filter by Location and Shop Status
        const filteredProducts = products.filter(product => {
            const shop = product.shop;
            if (!shop || !shop.isActive) return false;

            // 1. Radius Filter (Priority if lat/lng provided)
            if (lat && lng && shop.shopLocation && shop.shopLocation.coordinates) {
                const [shopLng, shopLat] = shop.shopLocation.coordinates;
                const dist = calculateDistance(lat, lng, shopLat, shopLng);
                product.distanceKm = dist; // Attach distance to product for sorting

                // If within radius, INCLUDE directly (Ignore City mismatch "Vadodara" vs "Vadodara Rural")
                if (dist <= parseFloat(radiusKm)) {
                    return true;
                }
                // If coordinates exist but outside radius, EXCLUDE
                return false;
            }

            // 2. Fallback City Filter (Only if no coordinates available to check distance)
            if (city && shop.city && shop.city.toLowerCase() !== city.toLowerCase()) {
                return false;
            }

            return true;
        });

        // 4. Sort by Distance (if available) or Availability
        filteredProducts.sort((a, b) => {
            // Out of stock last
            if (a.stockStatus === 'OUT_OF_STOCK' && b.stockStatus !== 'OUT_OF_STOCK') return 1;
            if (a.stockStatus !== 'OUT_OF_STOCK' && b.stockStatus === 'OUT_OF_STOCK') return -1;

            // Distance (nearest first)
            if (a.distanceKm && b.distanceKm) {
                return a.distanceKm - b.distanceKm;
            }
            return 0;
        });

        res.json({
            category: CATEGORIES.find(c => c.id === slug),
            products: filteredProducts
        });

    } catch (error) {
        console.error('Category Product Fetch Error:', error);
        res.status(500).json({ message: 'Server Error fetching category products' });
    }
});

module.exports = router;
