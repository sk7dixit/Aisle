/**
 * Mock AI Visual Service
 * Simulates image analysis to detect shop features, assign quality scores, and verify authenticity.
 */

const analyzeShopImage = async (imagePath, type) => {
    console.log(`[AI-Visual] Analyzing ${type} image: ${imagePath}`);

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple randomization for mock results
    const isRealShop = Math.random() > 0.15; // 85% success rate for demos
    const qualityScore = Math.floor(Math.random() * 4) + 6; // 6-10 range

    const tagPool = {
        SHOP_FRONT: ['storefront', 'signage', 'entrance', 'street-view'],
        SHOP_INTERIOR: ['shelves', 'counter', 'floor-plan', 'lighting'],
        PRODUCT_SHELF: ['organized-stock', 'pricing-labels', 'inventory', 'categories'],
        OWNER: ['professional', 'trustworthy', 'verification-photo']
    };

    const tags = tagPool[type] || ['general-shop'];
    const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 3);

    return {
        aiVerified: isRealShop,
        aiTags: randomTags,
        qualityScore: qualityScore,
        confidence: isRealShop ? 0.85 + (Math.random() * 0.1) : 0.4 + (Math.random() * 0.2),
        status: isRealShop ? 'verified' : 'rejected',
        rejectionReason: isRealShop ? null : 'Image does not clearly show a retail environment or is of poor quality.'
    };
};

module.exports = {
    analyzeShopImage
};
