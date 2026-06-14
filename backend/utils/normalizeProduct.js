const normalizeProduct = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

module.exports = normalizeProduct;
