const groceryProvider = require('./providers/grocery/groceryProvider');
const electronicsProvider = require('./providers/electronics/electronicsProvider');
const pharmacyProvider = require('./providers/pharmacy/pharmacyProvider');
const stationeryProvider = require('./providers/stationery/stationeryProvider');
const lifestyleProvider = require('./providers/lifestyle/lifestyleProvider');
const electricalProvider = require('./providers/electrical/electricalProvider');

/**
 * Dynamically resolves the active search provider for a seller's shopType.
 * Supports case-insensitive mapping and formats matching standard shop type strings.
 * @param {String} shopType - The seller's shopType.
 * @returns {Object} - Active provider sheet module.
 */
const getProvider = (shopType) => {
    if (!shopType) return groceryProvider;
    const type = shopType.toLowerCase().trim();

    switch (type) {
        case 'grocery':
        case 'grocery_kirana':
        case 'grocery_kirana_mart':
            return groceryProvider;

        case 'electronics':
        case 'tech_accessories':
        case 'tech_accessories_repair':
            return electronicsProvider;

        case 'electrical_hardware_auto':
        case 'electronics_tools':
            return electricalProvider;

        case 'pharmacy':
        case 'pharmacy_medical':
        case 'pharmacy_medical_store':
            return pharmacyProvider;

        case 'stationery':
        case 'student_office':
        case 'student_office_supplies':
            return stationeryProvider;

        case 'lifestyle':
        case 'home_lifestyle':
        case 'home_lifestyle_goods':
            return lifestyleProvider;

        default:
            console.log(`[ProviderResolver] Unknown shopType "${shopType}". Defaulting to grocery provider.`);
            return groceryProvider;
    }
};

module.exports = getProvider;
