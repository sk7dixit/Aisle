const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// @desc    Get Customer Profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Location (Simple GPS update legacy)
const updateLocation = async (req, res) => {
    try {
        const { lat, lng, area, city, pincode, state, address } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.customerLocation = {
            ...user.customerLocation,
            lat,
            lng,
            area,
            city,
            pincode,
            state,
            address: address, // Full address string
            isGpsSet: true,
            lastUpdatedAt: Date.now()
        };

        const updatedUser = await user.save();
        res.json(updatedUser.customerLocation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add New Address (Swiggy Style)
const addAddress = async (req, res) => {
    try {
        const {
            itemType, // Home, Work, Other
            receiverName,
            houseNo,
            street,
            landmark,
            city,
            state,
            pincode,
            coordinates
        } = req.body;

        if (!receiverName || !houseNo || !street || !city || !pincode || !coordinates) {
            return res.status(400).json({ message: 'Missing required address fields' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newAddress = {
            id: uuidv4(),
            itemType: itemType || 'Home',
            receiverName,
            houseNo,
            street,
            landmark,
            city,
            state,
            pincode,
            coordinates,
            isDefault: user.addresses && user.addresses.length === 0 // Make default if first address
        };

        if (!user.addresses) user.addresses = [];
        user.addresses.push(newAddress);

        // Also update the active customerLocation context
        user.customerLocation = {
            ...user.customerLocation,
            lat: coordinates.lat,
            lng: coordinates.lng,
            address: `${houseNo}, ${street}, ${city}`,
            area: street,
            city: city,
            pincode: pincode,
            isGpsSet: true,
            lastUpdatedAt: Date.now()
        };

        await user.save();
        res.status(201).json({ message: 'Address added', address: newAddress, addresses: user.addresses });

    } catch (error) {
        console.error("Add address error:", error);
        res.status(500).json({ message: 'Server error adding address' });
    }
};

// @desc    Get All Addresses
const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('addresses');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Preferences
const updatePreferences = async (req, res) => {
    try {
        const { discoveryPreferences, notificationPreferences, language } = req.body;
        const user = await User.findById(req.user._id);

        if (discoveryPreferences) user.discoveryPreferences = { ...user.discoveryPreferences, ...discoveryPreferences };
        if (notificationPreferences) user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };
        if (language) user.language = language;

        await user.save();
        res.json({ message: 'Preferences updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Interest
const toggleInterest = async (req, res) => {
    try {
        const { label } = req.body;
        const user = await User.findById(req.user._id);

        const exists = user.interestedIntents.find(i => i.label === label);
        if (exists) {
            user.interestedIntents = user.interestedIntents.filter(i => i.label !== label);
        } else {
            user.interestedIntents.push({ label });
        }

        await user.save();
        res.json(user.interestedIntents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateLocation,
    addAddress,
    getAddresses,
    updatePreferences,
    toggleInterest
};
