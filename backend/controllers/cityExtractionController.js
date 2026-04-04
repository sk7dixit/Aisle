const User = require('../models/User');

// @desc    Extract and save city from address
// @route   POST /api/seller/extract-city
// @access  Private (Seller)
const extractAndSaveCity = async (req, res) => {
    try {
        const sellerId = req.user._id;

        const seller = await User.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Check if city already exists
        if (seller.shopDetails?.location?.city) {
            return res.json({
                message: 'City already set',
                city: seller.shopDetails.location.city
            });
        }

        // Extract city from address
        const address = seller.shopDetails?.location?.address || seller.shopDetails?.address;

        if (!address) {
            return res.status(400).json({ message: 'No address found to extract city from' });
        }

        // Simple city extraction logic
        // Assumes format: "Street, Area, City, State" or similar
        const addressParts = address.split(',').map(part => part.trim());

        // Try to find city (usually 2nd or 3rd last part before state)
        let city = null;

        // Common patterns:
        // "Street, Area, City, City, State" -> take 3rd from end
        // "Street, City, State" -> take 2nd from end
        if (addressParts.length >= 3) {
            // Check if last part looks like a state (common Indian states)
            const lastPart = addressParts[addressParts.length - 1].toLowerCase();
            const states = ['gujarat', 'maharashtra', 'delhi', 'karnataka', 'tamil nadu', 'rajasthan', 'punjab', 'haryana', 'uttar pradesh', 'madhya pradesh'];

            if (states.some(state => lastPart.includes(state))) {
                // State found, city is likely 2nd from end
                city = addressParts[addressParts.length - 2];
            } else {
                // No clear state, take 2nd from end as city
                city = addressParts[addressParts.length - 2];
            }
        } else if (addressParts.length === 2) {
            city = addressParts[0];
        }

        if (!city) {
            return res.status(400).json({ message: 'Could not extract city from address' });
        }

        // Save city to database
        if (!seller.shopDetails.location) {
            seller.shopDetails.location = {};
        }
        seller.shopDetails.location.city = city;
        await seller.save();

        res.json({
            message: 'City extracted and saved successfully',
            city: city
        });
    } catch (error) {
        console.error('Extract City Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    extractAndSaveCity
};
