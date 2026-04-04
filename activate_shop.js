const mongoose = require('mongoose');
const User = require('./backend/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const seller = await User.findOne({ "shopDetails.shopName": /Dixit Mart/i });

        if (seller) {
            console.log(`Setting isActive: true for ${seller.shopDetails.shopName}`);

            // Set Active
            seller.shopDetails.isActive = true;
            seller.shopDetails.isOpen = true; // Ensure open too

            // Normalize City if needed for testing (Optional, but safe)
            // If user is "Vadodara Rural Taluka", maybe just "Vadodara" matches?
            // Let's assume the user location context might be specific.
            // For now, let's just fix the Active status which is definitively broken.

            await seller.markModified('shopDetails'); // Essential for mixed/nested updates sometimes
            await seller.save();
            console.log("Shop activated successfully.");
        } else {
            console.log("Dixit Mart not found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
