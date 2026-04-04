const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const { categorizeShop } = require('../services/aiCategorizationService');

dotenv.config();

const backfillCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const sellers = await User.find({ role: 'seller', 'shopDetails.shopName': { $exists: true } });
        console.log(`Found ${sellers.length} sellers to process...`);

        for (const seller of sellers) {
            const { shopName, description } = seller.shopDetails;
            const suggestions = await categorizeShop(shopName, description || '');
            const topAi = suggestions[0];

            let status = 'unclassified';
            if (topAi.confidence >= 0.8) status = 'auto';
            else if (topAi.confidence >= 0.5) status = 'suggested';

            seller.shopDetails.aiSuggestedCategory = topAi.category;
            seller.shopDetails.aiConfidence = topAi.confidence;
            seller.shopDetails.categoryStatus = status;

            // Optional: If auto, we could update the main category
            // if (status === 'auto') seller.shopDetails.category = topAi.category;

            await seller.save();
            console.log(`Processed: ${shopName} -> ${topAi.category} (${status})`);
        }

        console.log('Backfill complete!');
        process.exit();
    } catch (error) {
        console.error('Backfill error:', error);
        process.exit(1);
    }
};

backfillCategories();
