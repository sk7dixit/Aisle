const User = require('../models/User');
const Product = require('../models/Product');
const CreationRequest = require('../models/CreationRequest');
const Notification = require('../models/Notification');

// Helper: Calculate distance (Haversine Formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.round(d * 1000); // Return in meters
};

// @desc    Get Nearby Creators
// @route   GET /api/creators
// @access  Public
exports.getCreators = async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        // Fetch all home business creators
        const creators = await User.find({
            role: 'seller',
            'shopDetails.shopType': 'HOME_BUSINESS'
        }).select('shopDetails subscription _id');

        // Fetch product counts for each seller
        const creatorIds = creators.map(c => c._id);
        const creationCounts = await Product.aggregate([
            {
                $match: {
                    seller: { $in: creatorIds },
                    isAvailable: { $ne: false },
                    isDraft: { $ne: true }
                }
            },
            {
                $group: {
                    _id: '$seller',
                    count: { $sum: 1 }
                }
            }
        ]);

        const countsMap = creationCounts.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});

        const formatted = creators.map(c => {
            const sd = c.shopDetails || {};
            let distance = null;

            if (!isNaN(userLat) && !isNaN(userLng) && sd.shopLocation?.coordinates) {
                distance = calculateDistance(
                    userLat, userLng,
                    sd.shopLocation.coordinates[1],
                    sd.shopLocation.coordinates[0]
                );
            }

            return {
                _id: c._id,
                name: sd.shopName || 'Independent Creator',
                category: sd.category || 'Home Business',
                address: sd.address || '',
                isOpen: sd.operatingMode !== 'RUSH', // Check status
                distance: distance,
                rating: sd.rating || 0,
                numReviews: sd.numReviews || 0,
                shopImage: sd.photos?.[0] || sd.logo || null,
                creationCount: countsMap[c._id.toString()] || 0,
                story: sd.description || 'Crafting unique handmade creations and recipes locally.'
            };
        });

        // Filter by radius if coordinates are provided
        const filtered = formatted.filter(c => {
            if (!isNaN(userLat) && !isNaN(userLng) && c.distance !== null) {
                return c.distance <= searchRadius * 1000;
            }
            return true;
        });

        // Sort by distance if available, otherwise by rating
        if (!isNaN(userLat)) {
            filtered.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
        } else {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        res.json(filtered);
    } catch (error) {
        console.error('Get Creators Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Single Creator Profile & Creations
// @route   GET /api/creators/:id
// @access  Public
exports.getCreatorById = async (req, res) => {
    try {
        const creator = await User.findById(req.params.id);
        if (!creator || creator.role !== 'seller' || creator.shopDetails?.shopType !== 'HOME_BUSINESS') {
            return res.status(404).json({ message: 'Creator not found' });
        }

        // Fetch creations (Products)
        const creations = await Product.find({
            seller: creator._id,
            isDraft: { $ne: true },
            isAvailable: { $ne: false }
        });

        // Group creations by category
        const { getCategoriesForShop } = require('../utils/shopCategoryConfig');
        const categoriesList = getCategoriesForShop('HOME_BUSINESS');

        const categoriesMap = {};
        categoriesList.forEach(cat => {
            categoriesMap[cat] = [];
        });

        creations.forEach(c => {
            const cat = c.category || 'Other';
            if (categoriesMap[cat]) {
                categoriesMap[cat].push(c);
            } else {
                if (!categoriesMap['Other']) categoriesMap['Other'] = [];
                categoriesMap['Other'].push(c);
            }
        });

        const groupedCreations = Object.keys(categoriesMap)
            .map(cat => ({
                categoryName: cat,
                items: categoriesMap[cat]
            }))
            .filter(group => group.items.length > 0); // Only return groups with items

        res.json({
            creator: {
                _id: creator._id,
                name: creator.shopDetails?.shopName || 'Independent Creator',
                rating: creator.shopDetails?.rating || 0,
                numReviews: creator.shopDetails?.numReviews || 0,
                address: creator.shopDetails?.address || '',
                shopImage: creator.shopDetails?.photos?.[0] || null,
                story: creator.shopDetails?.description || 'Crafting unique handmade creations and recipes locally.',
                isOpen: creator.shopDetails?.operatingMode !== 'RUSH',
                phone: creator.shopDetails?.phone || creator.phone || ''
            },
            creations: groupedCreations
        });
    } catch (error) {
        console.error('Get Creator Profile Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Popular/Recent Creations
// @route   GET /api/creations
// @access  Public
exports.getCreations = async (req, res) => {
    try {
        const creations = await Product.find({
            shopType: 'HOME_BUSINESS',
            isDraft: { $ne: true },
            isAvailable: { $ne: false }
        })
            .populate('seller', 'shopDetails')
            .sort({ createdAt: -1 })
            .limit(20);

        const formatted = creations.map(c => ({
            _id: c._id,
            name: c.name,
            imageUrl: c.imageUrl || (c.images && c.images[0]) || 'https://via.placeholder.com/150',
            price: c.sellingPrice || c.price || 0,
            unit: c.unit || 'piece',
            homeBusinessType: c.homeBusinessType || 'READY_STOCK',
            preparationTime: c.preparationTime || '',
            creatorName: c.seller?.shopDetails?.shopName || 'Independent Creator',
            creatorId: c.seller?._id
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Get Creations Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Single Creation Details
// @route   GET /api/creations/:id
// @access  Public
exports.getCreationById = async (req, res) => {
    try {
        const creation = await Product.findOne({
            _id: req.params.id,
            isDraft: { $ne: true },
            isAvailable: { $ne: false }
        }).populate('seller', 'shopDetails');

        if (!creation) {
            return res.status(404).json({ message: 'Creation not found' });
        }

        res.json({
            _id: creation._id,
            name: creation.name,
            imageUrl: creation.imageUrl,
            images: creation.images && creation.images.length > 0 ? creation.images : [creation.imageUrl],
            price: creation.sellingPrice || creation.price || 0,
            mrp: creation.mrp || 0,
            unit: creation.unit || 'piece',
            description: creation.description || '',
            homeBusinessType: creation.homeBusinessType || 'READY_STOCK',
            preparationTime: creation.preparationTime || '',
            productStory: creation.productStory || '',
            quantity: creation.quantity || 0,
            stockStatus: creation.stockStatus || 'IN_STOCK',
            category: creation.category || 'Home Business',
            creatorName: creation.seller?.shopDetails?.shopName || 'Independent Creator',
            creatorId: creation.seller?._id,
            creatorStory: creation.seller?.shopDetails?.description || ''
        });
    } catch (error) {
        console.error('Get Creation Detail Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create Custom Creation Request (Customer)
// @route   POST /api/creation-requests
// @access  Private (Customer)
exports.createCreationRequest = async (req, res) => {
    try {
        const { creationId, quantity = 1, preferredPickupTime, message = '' } = req.body;
        const customerId = req.user._id;

        // Find product
        const creation = await Product.findById(creationId);
        if (!creation || creation.isDraft) {
            return res.status(404).json({ message: 'Creation not found' });
        }

        // Create request
        const request = await CreationRequest.create({
            customerId,
            creatorId: creation.seller,
            creationId,
            quantity: Number(quantity),
            preferredPickupTime,
            message
        });

        // Trigger Notification to Creator
        await Notification.create({
            user: creation.seller,
            type: 'ORDER',
            title: 'New Creation Request Received',
            message: `New request from ${req.user.name || 'a customer'} for ${creation.name} (${quantity} units).`,
            priority: 'IMPORTANT',
            recipientRole: 'seller',
            meta: { requestId: request._id }
        });

        res.status(201).json({
            message: 'Creation request submitted successfully!',
            request
        });
    } catch (error) {
        console.error('Create Request Error:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get Seller's Creation Requests (Dashboard)
// @route   GET /api/seller/creation-requests
// @access  Private (Creator)
exports.getSellerCreationRequests = async (req, res) => {
    try {
        const requests = await CreationRequest.find({ creatorId: req.user._id })
            .populate('customerId', 'name phone email')
            .populate('creationId', 'name images imageUrl sellingPrice price unit')
            .sort({ createdAt: -1 });

        // Map to format required by dashboard UI
        const formatted = requests.map(r => {
            const cName = r.customerId?.name || 'Guest Customer';
            const cPhone = r.customerId?.phone || 'No phone provided';
            const creation = r.creationId || {};
            const img = creation.imageUrl || (creation.images && creation.images[0]) || '';
            const price = creation.sellingPrice || creation.price || 0;

            return {
                visitId: r._id.toString(), // map to visitId for page safety
                customerName: cName,
                customerMobile: cPhone,
                visitTime: r.preferredPickupTime,
                orderTime: new Date(r.createdAt).toLocaleDateString() + ' ' + new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                visitStatus: r.status, // PENDING, ACCEPTED, DECLINED, etc.
                paymentStatus: 'PENDING',
                paymentMode: 'PAY_ON_DELIVERY',
                totalAmount: price * r.quantity,
                products: [
                    {
                        name: creation.name || 'Unknown Creation',
                        qty: r.quantity,
                        price: price,
                        image: img
                    }
                ],
                customerNote: r.message,
                alternativeProposal: r.alternativeProposal || ''
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Get Seller Requests Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Action on Creation Request (Accept, Decline, Suggest Alternative)
// @route   PATCH /api/seller/creation-requests/:id
// @access  Private (Creator)
exports.updateCreationRequestStatus = async (req, res) => {
    try {
        const { status, alternativeProposal = '' } = req.body;
        const request = await CreationRequest.findOne({ _id: req.params.id, creatorId: req.user._id })
            .populate('creationId', 'name')
            .populate('creatorId', 'shopDetails');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = status;
        if (alternativeProposal) {
            request.alternativeProposal = alternativeProposal;
        }

        await request.save();

        // Notify Customer
        const shopName = request.creatorId?.shopDetails?.shopName || 'Creator';
        let notifyMessage = `Your request for ${request.creationId?.name} has been accepted by ${shopName}.`;
        if (status === 'DECLINED') {
            notifyMessage = `Your request for ${request.creationId?.name} has been declined by ${shopName}.`;
        } else if (status === 'ALTERNATIVE_SUGGESTED') {
            notifyMessage = `${shopName} suggested alternative pickup details for your request: "${alternativeProposal}".`;
        }

        await Notification.create({
            user: request.customerId,
            type: 'ORDER',
            title: `Creation Request ${status.replace('_', ' ').toLowerCase()}`,
            message: notifyMessage,
            priority: 'HIGH',
            recipientRole: 'customer',
            meta: { requestId: request._id }
        });

        res.json({
            message: `Request status updated to ${status} successfully!`,
            request
        });
    } catch (error) {
        console.error('Action Request Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
