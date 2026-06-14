const Product = require('../models/Product');
const SearchAnalytics = require('../models/SearchAnalytics');

const trackProductClick = async (req, res) => {
    try {
        const { searchId, productId } = req.body;
        if (!searchId || !productId) {
            return res.status(400).json({ success: false, message: 'searchId and productId are required' });
        }

        // Fetch product to resolve its shop/seller ID
        const product = await Product.findById(productId);
        const shopId = product ? (product.seller || product.shop) : null;

        const updated = await SearchAnalytics.findByIdAndUpdate(
            searchId,
            { 
                $set: { 
                    clickedProductId: productId,
                    clickedShopId: shopId
                }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Search analytics record not found' });
        }

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('[AnalyticsEngine] Product Click Tracking Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    trackProductClick
};
