const Fuse = require('fuse.js');

/**
 * Fuzzy matches a list of products against a search query.
 * @param {Array} products - List of catalog items.
 * @param {String} query - The search query term.
 * @returns {Array} - List of search results matched with scores.
 */
const matchProducts = (products, query) => {
    if (!products || products.length === 0) return [];
    
    const fuse = new Fuse(products, {
        keys: [
            'name',
            'brand',
            'category'
        ],
        threshold: 0.35,
        includeScore: true
    });

    return fuse.search(query);
};

module.exports = {
    matchProducts
};
