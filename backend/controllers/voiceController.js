const Product = require('../models/Product');
const { CATEGORY_MAP } = require('../config/categories');

// Helper to clean text
const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
};

// Helper to escape regex special characters
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper to extract quantity and unit
const extractQuantity = (text) => {
    // Basic extraction logic
    const numberMatch = text.match(/(\d+(\.\d+)?)/);
    return numberMatch ? parseFloat(numberMatch[0]) : 1;
};

// Main Process Function
const processVoiceInput = async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript) {
            return res.status(400).json({ message: 'No transcript provided' });
        }

        // 1. Split logic FIRST (on raw transcript) to catch commas/separators
        // Split by: comma, newlines, or case-insensitive "and"/"next"/"aur" surrounded by word boundaries
        const rawItems = transcript.split(/,|\b(and|aur|next)\b|\n/i);

        const results = [];

        for (let itemStr of rawItems) {
            // 2. Normalize AFTER splitting
            let cleanName = normalizeText(itemStr);

            if (cleanName.length < 2) continue;

            const detectedQty = extractQuantity(cleanName);

            // Remove number matches to get pure product name
            cleanName = cleanName.replace(/(\d+(\.\d+)?)/g, '').trim();

            if (!cleanName) continue; // Skip if only number

            let matchedData = null;
            let matchType = 'NONE';

            // Safe Regex Construction
            const safeNameRegex = new RegExp(`^${escapeRegex(cleanName)}$`, 'i');

            // CHECK 1: Exact Product Match (Highest Priority)
            const exactProduct = await Product.findOne({
                name: { $regex: safeNameRegex }
            });

            if (exactProduct) {
                matchedData = {
                    name: exactProduct.name,
                    category: exactProduct.category,
                    subCategory: exactProduct.subCategory || 'General',
                    price: exactProduct.price,
                    isExact: true
                };
                matchType = 'EXACT_PRODUCT';
            } else {
                // CHECK 2: Subcategory Match (Medium Priority)
                let foundCategory = null;
                let foundSubCategory = null;

                // Flatten CATEGORY_MAP to searching
                for (const [cat, subCats] of Object.entries(CATEGORY_MAP)) {
                    if (subCats.some(sub => sub.toLowerCase() === cleanName.toLowerCase())) {
                        foundCategory = cat;
                        foundSubCategory = subCats.find(sub => sub.toLowerCase() === cleanName.toLowerCase()); // Get correct casing
                        break;
                    }
                }

                if (foundCategory) {
                    matchedData = {
                        name: cleanName,
                        category: foundCategory,
                        subCategory: foundSubCategory,
                        price: 0,
                        isExact: false
                    };
                    matchType = 'SUBCATEGORY_MATCH';
                } else {
                    // CHECK 3: No Match (Fallback)
                    matchedData = {
                        name: cleanName,
                        category: 'Others',
                        subCategory: 'Seller Added',
                        price: 0,
                        isExact: false
                    };
                    matchType = 'FALLBACK';
                }
            }

            results.push({
                originalTerm: itemStr.trim(),
                name: matchedData.name,
                category: matchedData.category,
                subCategory: matchedData.subCategory,
                price: matchedData.price,
                quantity: detectedQty,
                unit: 'pc',
                matchType
            });
        }

        res.json({ results });

    } catch (error) {
        console.error("Voice Processing Error:", error);
        res.status(500).json({ message: 'Server Process Error' });
    }
};

module.exports = { processVoiceInput };
