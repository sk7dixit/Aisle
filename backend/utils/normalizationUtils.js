/**
 * PRODUCT NORMALIZATION UTILITIES
 * 
 * Logic summarized:
 * 1. Normalize Name (Trim, Lowercase, Remove Punctuation)
 * 2. Synonym Resolution (Chawal -> Rice, Aata -> Atta)
 * 3. Identity Generation: name + unit + packSize + brand
 */

const SYNONYM_MAP = {
    "chawal": "rice",
    "basmati": "rice",
    "shakkar": "sugar",
    "cheeni": "sugar",
    "namak": "salt",
    "aata": "atta",
    "wheat flour": "atta",
    "tel": "oil",
    "doodh": "milk",
    "pyaaz": "onion",
    "tamatar": "tomato",
    "aloo": "potato",
    "sabun": "soap"
};

/**
 * Normalizes a product name for identity matching
 */
const normalizeProductName = (name) => {
    if (!name) return "";

    // 1. Basic clean
    let normalized = name.toLowerCase().trim();
    normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // Remove punctuation
    normalized = normalized.replace(/\s{2,}/g, " "); // Extra spaces

    // 2. Exact Synonym Match
    if (SYNONYM_MAP[normalized]) {
        return SYNONYM_MAP[normalized];
    }

    // 3. Keyword Match (e.g. "Tata Salt" -> "Salt")
    for (const [key, replacement] of Object.entries(SYNONYM_MAP)) {
        if (normalized.includes(key)) {
            return replacement;
        }
    }

    return normalized;
};

/**
 * Generates a unique "identity key" for a product
 */
const getProductIdentity = (product) => {
    const name = normalizeProductName(product.name || "");
    const unit = (product.unit || "piece").toLowerCase().trim();
    const size = (product.packSize || "").toLowerCase().trim();
    const brand = (product.brand || "none").toLowerCase().trim();

    return `${name}|${unit}|${size}|${brand}`;
};

module.exports = {
    normalizeProductName,
    getProductIdentity
};
