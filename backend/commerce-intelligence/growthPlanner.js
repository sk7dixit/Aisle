const GrowthRoadmap = require('../models/GrowthRoadmap');
const buildSellerContext = require('../support/context/contextBuilder');

/**
 * Computes growth score and outlines guided roadmaps.
 */
const planGrowth = async (sellerId, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    
    // Milestones checks
    const hasProfileDesc = !!context.shop?.description;
    const hasProfileLogo = !!context.shop?.logo;
    const hasProfileBanner = !!context.shop?.banner;
    const isProfileComplete = hasProfileDesc && hasProfileLogo && hasProfileBanner;

    const totalProducts = context.products?.totalProducts || 0;
    const productsGoalMet = totalProducts >= 25;

    const offersList = context.offers?.list || [];
    const hasOffersEnabled = offersList.length > 0;

    const milestones = [
        { step: 1, title: 'Complete Shop Profile details', points: 15, completed: isProfileComplete },
        { step: 2, title: 'Add 25 active product listings', points: 20, completed: productsGoalMet },
        { step: 3, title: 'Enable seasonal discount offers', points: 15, completed: hasOffersEnabled },
        { step: 4, title: 'Verify bank details routing setup', points: 50, completed: context.payments?.paymentSetupCompleted || false }
    ];

    // Compute score based on completed points
    let currentScore = 0;
    milestones.forEach(m => {
        if (m.completed) {
            currentScore += m.points;
        }
    });

    const roadmap = await GrowthRoadmap.findOneAndUpdate(
        { sellerId },
        { 
            score: currentScore,
            nextMilestones: milestones
        },
        { new: true, upsert: true }
    );
    
    return roadmap;
};

module.exports = {
    planGrowth
};
