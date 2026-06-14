/**
 * Rule-based category detector to automatically match product names to Shoplens Kirana category slugs.
 * @param {String} name - Product name.
 * @returns {String} - Shoplens Category slug.
 */
const detectCategory = (name) => {
    if (!name) return 'general-provision';
    const lowerName = name.toLowerCase();

    // 1. Dairy & Ice Cream
    if (
        lowerName.includes('milk') || 
        lowerName.includes('dairy') || 
        lowerName.includes('cheese') || 
        lowerName.includes('ice cream') || 
        lowerName.includes('yogurt') || 
        lowerName.includes('butter') || 
        lowerName.includes('paneer') || 
        lowerName.includes('curd') || 
        lowerName.includes('ghee') || 
        lowerName.includes('cream')
    ) {
        return 'dairy-ice-cream';
    }

    // 2. Bakery & Cake Shop
    if (
        lowerName.includes('bakery') || 
        lowerName.includes('bread') || 
        lowerName.includes('bun') || 
        lowerName.includes('toast') || 
        lowerName.includes('cake') || 
        lowerName.includes('croissant') || 
        lowerName.includes('pastry') || 
        lowerName.includes('puff') || 
        lowerName.includes('cookie')
    ) {
        return 'bakery-cake-shop';
    }

    // 3. Fruits & Vegetables
    if (
        lowerName.includes('fruit') || 
        lowerName.includes('apple') || 
        lowerName.includes('banana') || 
        lowerName.includes('mango') || 
        lowerName.includes('orange') || 
        lowerName.includes('vegetable') || 
        lowerName.includes('potato') || 
        lowerName.includes('onion') || 
        lowerName.includes('tomato') || 
        lowerName.includes('garlic') || 
        lowerName.includes('ginger') || 
        lowerName.includes('chilli')
    ) {
        return 'fruits-vegetables';
    }

    // 4. Sweet Shop (Confectionery, chocolates, sweets)
    if (
        lowerName.includes('sweet') || 
        lowerName.includes('mithai') || 
        lowerName.includes('chocolate') || 
        lowerName.includes('candy') || 
        lowerName.includes('confectionery') || 
        lowerName.includes('laddoo') || 
        lowerName.includes('halwa') || 
        lowerName.includes('pedha') || 
        lowerName.includes('barfi')
    ) {
        return 'sweet-shop';
    }

    // 5. Dry Fruits & Spices
    if (
        lowerName.includes('spice') || 
        lowerName.includes('masala') || 
        lowerName.includes('pepper') || 
        lowerName.includes('dry fruit') || 
        lowerName.includes('almond') || 
        lowerName.includes('cashew') || 
        lowerName.includes('nuts') || 
        lowerName.includes('turmeric') || 
        lowerName.includes('cardamom') || 
        lowerName.includes('clove') || 
        lowerName.includes('raisin')
    ) {
        return 'dry-fruits-spices';
    }

    // 6. Wholesale & Grain Mart
    if (
        lowerName.includes('grain') || 
        lowerName.includes('rice') || 
        lowerName.includes('wheat') || 
        lowerName.includes('dal') || 
        lowerName.includes('flour') || 
        lowerName.includes('atta') || 
        lowerName.includes('cereal') || 
        lowerName.includes('pulse') || 
        lowerName.includes('lentil')
    ) {
        return 'wholesale-grain';
    }

    // 7. Organic & Gourmet
    if (
        lowerName.includes('organic') || 
        lowerName.includes('gourmet') || 
        lowerName.includes('honey') || 
        lowerName.includes('tea') || 
        lowerName.includes('coffee') || 
        lowerName.includes('herbal') || 
        lowerName.includes('quinoa') || 
        lowerName.includes('chia')
    ) {
        return 'organic-gourmet';
    }

    // Default to general grocery provision
    return 'general-provision';
};

module.exports = detectCategory;
