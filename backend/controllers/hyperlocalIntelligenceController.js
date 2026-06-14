const AreaIntelligence = require("../models/AreaIntelligence");
const AreaTrend = require("../models/AreaTrend");
const OpportunityZone = require("../models/OpportunityZone");
const User = require("../models/User");
const Product = require("../models/Product");

const {
    runHyperlocalPipeline,
    getExpansionSuggestions,
    getAreaInventorySuggestions,
    getAreaPricingRange,
    getHyperlocalForecast,
    geocodeCoordsToArea
} = require("../services/hyperlocalIntelligenceService");

/**
 * Get hyperlocal seller metrics.
 * GET /api/seller/hyperlocal/dashboard
 */
const getSellerHyperlocalDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // 1. Fetch the seller shop area
        const seller = await User.findById(sellerId);
        if (!seller || !seller.shopDetails) {
            return res.status(400).json({ message: "Seller profile or shop details not found" });
        }
        
        const shopLoc = seller.shopDetails.shopLocation || {};
        const coords = shopLoc.coordinates || [];
        const currentAreaObj = geocodeCoordsToArea(coords[1], coords[0], seller.shopDetails.address);

        // 3. Compile suggestions
        const expansionSuggestions = await getExpansionSuggestions(sellerId);
        const inventorySuggestions = await getAreaInventorySuggestions(sellerId);
        const localTrends = await AreaTrend.find({ area: currentAreaObj.name }).sort({ trendScore: -1 });

        // Compile some pricing intelligence for active products in inventory
        const sellerProducts = await Product.find({ seller: sellerId });
        const pricingSuggestions = sellerProducts.map(p => {
            const advice = getAreaPricingRange(currentAreaObj.name, p.category, p.sellingPrice);
            return {
                productId: p._id,
                productName: p.name,
                currentPrice: p.sellingPrice,
                optimalMin: advice.optimalMin,
                optimalMax: advice.optimalMax,
                strategy: advice.strategy,
                demographic: advice.demographic
            };
        });

        // 4. Fetch all active opportunity zones
        const activeOpportunityZones = await OpportunityZone.find({}).sort({ gapScore: -1 }).limit(10);

        return res.status(200).json({
            area: currentAreaObj.name,
            pincode: currentAreaObj.pincode,
            expansionSuggestions,
            inventorySuggestions,
            localTrends: localTrends.map(t => ({
                product: t.product,
                growth: t.growth,
                trendScore: t.trendScore,
                searches: t.searches,
                orders: t.orders
            })),
            pricingSuggestions,
            activeOpportunityZones
        });

    } catch (err) {
        console.error("[HyperlocalController] Error compiling seller dashboard:", err);
        return res.status(500).json({ message: "Server error compiling Hyperlocal Dashboard" });
    }
};

/**
 * Get Indore city-wide demand heatmap for admins.
 * GET /api/admin/hyperlocal/heatmap
 */
const getAdminHyperlocalHeatmap = async (req, res) => {
    try {
        const areas = await AreaIntelligence.find({}).sort({ demandScore: -1 });
        const trends = await AreaTrend.find({}).sort({ trendScore: -1 }).limit(10);
        
        // Sum total platform coverage (active shops per area)
        const coverageDetails = [];
        for (const a of areas) {
            const activeSellersCount = await User.countDocuments({
                role: "seller",
                verificationStatus: "approved"
                // Mapped in geocode to this area later if needed, but we can query by coordinates
            });
            
            coverageDetails.push({
                area: a.area,
                pincode: a.pincode,
                demandScore: a.demandScore,
                supplyScore: a.supplyScore,
                trendScore: a.trendScore,
                gap: a.demandScore - a.supplyScore
            });
        }

        return res.status(200).json({
            areas: areas.map(a => ({
                area: a.area,
                pincode: a.pincode,
                lat: a.latitude,
                lng: a.longitude,
                demandScore: a.demandScore,
                supplyScore: a.supplyScore,
                populationScore: a.populationScore
            })),
            trends: trends.map(t => ({
                area: t.area,
                product: t.product,
                growth: t.growth,
                trendScore: t.trendScore
            })),
            coverageDetails
        });

    } catch (err) {
        console.error("[HyperlocalController] Error compiling admin heatmap:", err);
        return res.status(500).json({ message: "Server error compiling admin heatmap" });
    }
};

/**
 * Trigger hyperlocal engine pipeline calculation.
 * POST /api/seller/hyperlocal/trigger
 */
const triggerHyperlocalPipelineRun = async (req, res) => {
    try {
        console.log("[HyperlocalController] Manually triggering hyperlocal calculation pipeline...");
        await runHyperlocalPipeline();
        return res.status(200).json({ message: "Hyperlocal intelligence pipeline completed successfully." });
    } catch (err) {
        console.error("[HyperlocalController] Manual pipeline run failed:", err);
        return res.status(500).json({ message: "Server error running hyperlocal pipeline" });
    }
};

module.exports = {
    getSellerHyperlocalDashboard,
    getAdminHyperlocalHeatmap,
    triggerHyperlocalPipelineRun
};
