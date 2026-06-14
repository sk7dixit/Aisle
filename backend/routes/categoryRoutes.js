const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Shop = require('../models/Shop'); // Ensure you have this model
const User = require('../models/User');
const { calculateDistance } = require('../utils/distance'); // Helper needed
const CATEGORIES = require('../config/categories');

// GET /api/categories
// Returns the master list of categories
router.get('/', (req, res) => {
    res.json(CATEGORIES);
});

// GET /api/categories/stats
// Returns real counts for categories, active shops, and home business creators
router.get('/stats', async (req, res) => {
    try {
        // Optimize: Execute only 2 parallel database queries and exclude heavy fields like faceData
        const [sellers, productCounts] = await Promise.all([
            User.find({ role: 'seller' })
                .select('shopDetails.shopType shopDetails.allowedSubCategories')
                .lean(),
            Product.aggregate([
                {
                    $match: {
                        isAvailable: { $ne: false },
                        isDraft: { $ne: true },
                        adminStatus: 'Active'
                    }
                },
                {
                    $group: {
                        _id: "$categorySlug",
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Compute counts in memory to eliminate sequential database calls
        let shopsCount = 0;
        let creatorsCount = 0;
        const activeShopTypesSet = new Set();

        sellers.forEach(seller => {
            const shopType = seller.shopDetails?.shopType;
            if (shopType) {
                activeShopTypesSet.add(shopType);
                if (shopType === 'HOME_BUSINESS') {
                    creatorsCount++;
                } else if (shopType !== 'SERVICES') {
                    shopsCount++;
                }
            }
        });

        const categoriesCount = activeShopTypesSet.size;

        // Subcategory mapping from config slugs to database keys
        const slugToDbSubcat = {
            'general-provision': 'general_provision',
            'fruits-vegetables': 'fruits_vegetables',
            'dairy-ice-cream': 'dairy_bakery',
            'bakery-cake-shop': 'dairy_bakery',
            'sweet-shop': 'sweets_farsan',
            'dry-fruits-spices': 'dry_fruits_spices',
            'wholesale-grain': 'wholesale',
            'organic-gourmet': 'organic',
            'electrical-shop': 'electrical',
            'hardware-sanitary': 'hardware',
            'paints-decor': 'paint',
            'automobile-spares': 'automobile',
            'tools-industrial': 'industrial',
            'mobiles-wearables': 'mobile',
            'computers-gaming': 'computer',
            'tv-appliances': 'consumer_electronics',
            'spares-components': 'repair',
            'school-writing': 'stationery',
            'office-desk': 'office',
            'art-craft': 'art',
            'books-paper': 'books',
            'kitchenware-cookware': 'kitchenware',
            'plastics-cleaning': 'cleaning',
            'beauty-personal': 'other',
            'toys-sports': 'gifts',
            'furnishing-decor': 'furnishing',
            'bags-luggage': 'bags',
            'footwear': 'footwear',
            'clothing-garments': 'clothing',
            'allopathic-chemist': 'allopathic',
            'ayurvedic-herbal': 'ayurvedic',
            'surgical-equipment': 'surgical',
            'homemade-food': 'food',
            'handmade-crafts': 'handicrafts',
            'tuition-coaching': 'other',
            'festival-specific': 'festival',
            'crackers-fireworks': 'crackers',
            'winter-rain-gear': 'weather'
        };

        const categoryIdToShopType = {
            'general-provision': 'GROCERY_KIRANA',
            'fruits-vegetables': 'GROCERY_KIRANA',
            'dairy-ice-cream': 'GROCERY_KIRANA',
            'bakery-cake-shop': 'GROCERY_KIRANA',
            'sweet-shop': 'GROCERY_KIRANA',
            'dry-fruits-spices': 'GROCERY_KIRANA',
            'wholesale-grain': 'GROCERY_KIRANA',
            'organic-gourmet': 'GROCERY_KIRANA',
            'electrical-shop': 'ELECTRICAL_HARDWARE_AUTO',
            'hardware-sanitary': 'ELECTRICAL_HARDWARE_AUTO',
            'paints-decor': 'ELECTRICAL_HARDWARE_AUTO',
            'automobile-spares': 'ELECTRICAL_HARDWARE_AUTO',
            'tools-industrial': 'ELECTRICAL_HARDWARE_AUTO',
            'mobiles-wearables': 'TECH_ACCESSORIES',
            'computers-gaming': 'TECH_ACCESSORIES',
            'tv-appliances': 'TECH_ACCESSORIES',
            'spares-components': 'TECH_ACCESSORIES',
            'school-writing': 'STUDENT_OFFICE',
            'office-desk': 'STUDENT_OFFICE',
            'art-craft': 'STUDENT_OFFICE',
            'books-paper': 'STUDENT_OFFICE',
            'kitchenware-cookware': 'HOME_LIFESTYLE',
            'plastics-cleaning': 'HOME_LIFESTYLE',
            'beauty-personal': 'HOME_LIFESTYLE',
            'toys-sports': 'HOME_LIFESTYLE',
            'furnishing-decor': 'HOME_LIFESTYLE',
            'bags-luggage': 'HOME_LIFESTYLE',
            'footwear': 'HOME_LIFESTYLE',
            'clothing-garments': 'HOME_LIFESTYLE',
            'allopathic-chemist': 'PHARMACY',
            'ayurvedic-herbal': 'PHARMACY',
            'surgical-equipment': 'PHARMACY',
            'homemade-food': 'HOME_BUSINESS',
            'handmade-crafts': 'HOME_BUSINESS',
            'tuition-coaching': 'HOME_BUSINESS',
            'festival-specific': 'SEASONAL_FESTIVE',
            'crackers-fireworks': 'SEASONAL_FESTIVE',
            'winter-rain-gear': 'SEASONAL_FESTIVE'
        };

        const categoriesList = CATEGORIES;
        const categoryStats = {};

        const productCountMap = {};
        productCounts.forEach(item => {
            if (item._id) {
                productCountMap[item._id] = item.count;
            }
        });

        for (const cat of categoriesList) {
            const dbSubcat = slugToDbSubcat[cat.id] || cat.id;
            const parentShopType = categoryIdToShopType[cat.id];

            // Filter sellers in memory
            const storeCount = sellers.filter(seller => {
                const sd = seller.shopDetails || {};
                const allowedSubcats = sd.allowedSubCategories || [];

                // 1. Explicit subcategory match
                if (allowedSubcats.includes(cat.id) || allowedSubcats.includes(dbSubcat)) {
                    return true;
                }

                // 2. Fallback: Parent shop type match with empty/missing subcategories
                if (sd.shopType === parentShopType) {
                    if (!sd.allowedSubCategories || sd.allowedSubCategories.length === 0) {
                        return true;
                    }
                }

                return false;
            }).length;

            categoryStats[cat.id] = {
                stores: storeCount,
                products: productCountMap[cat.id] || 0
            };
        }

        res.json({
            categoriesCount,
            shopsCount,
            creatorsCount,
            categoryStats
        });
    } catch (error) {
        console.error('Fetch category stats error:', error);
        res.status(500).json({ message: 'Server Error fetching category stats' });
    }
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
            .populate('shop', 'name city shopLocation isActive isOpen contactPhone') // Select specific fields
            .populate('seller', 'phone shopDetails')
            .lean();

        // 3. Filter by Location and Shop Status
        const filteredProducts = products.filter(product => {
            // Synthesize product.shop if missing (since Shop collection is not used/empty)
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

        const mappedProducts = filteredProducts.map(product => ({
            ...product,
            price: product.sellingPrice || product.price || 0,
            image: product.imageUrl || product.image || 'https://via.placeholder.com/150'
        }));

        res.json({
            category: CATEGORIES.find(c => c.id === slug),
            products: mappedProducts
        });

    } catch (error) {
        console.error('Category Product Fetch Error:', error);
        res.status(500).json({ message: 'Server Error fetching category products' });
    }
});

module.exports = router;
