const normalizeProduct = require('./normalizeProduct');

/**
 * Checks if two product names represent the same product after normalization.
 * @param {String} name1 - First product name.
 * @param {String} name2 - Second product name.
 * @returns {Boolean} - True if identical after stripping non-alphanumeric keys.
 */
const isDuplicate = (name1, name2) => {
    if (!name1 || !name2) return false;
    return normalizeProduct(name1) === normalizeProduct(name2);
};

module.exports = isDuplicate;
