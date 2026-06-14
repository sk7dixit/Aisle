const { getNormalizedShopType } = require('../context/businessContext');
const GroceryRules = require('./groceryRules');
const PharmacyRules = require('./pharmacyRules');
const ElectronicsRules = require('./electronicsRules');
const ServiceRules = require('./serviceRules');
const HomeBusinessRules = require('./homeBusinessRules');
const SeasonalRules = require('./seasonalRules');

const rulesMap = {
    GROCERY_KIRANA: GroceryRules,
    PHARMACY_MEDICAL: PharmacyRules,
    ELECTRONICS_TOOLS: ElectronicsRules,
    SERVICES: ServiceRules,
    HOME_BUSINESS: HomeBusinessRules,
    SEASONAL_FESTIVE: SeasonalRules
};

const getRulesByShopType = (shopType) => {
    const normalized = getNormalizedShopType(shopType);
    const rulesClass = rulesMap[normalized] || GroceryRules; // Default to Grocery
    return new rulesClass();
};

module.exports = {
    getRulesByShopType
};
