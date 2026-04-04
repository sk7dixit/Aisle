const Product = require('../models/Product');
const User = require('../models/User');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { assignCategoryAI } = require('../utils/categoryAI');
const { getProductIdentity } = require('../utils/normalizationUtils');
const StockMovement = require('../models/StockMovement');

// 1. Alias Maps (The "Brain")
const ALIAS_MAP = {
    productName: ['product', 'productname', 'item', 'itemname', 'name', 'description'],
    quantity: ['qty', 'quantity', 'stock', 'count', 'units', 'pcs'],
    price: ['price', 'mrp', 'rate', 'amount', 'sellingprice', 'cost'],
    brand: ['brand', 'company', 'manufacturer', 'make']
};

// 2. Normalization Helper
const normalize = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().replace(/[\s_-]/g, '');
};

// 3. Smart Detection Engine
const detectColumns = (headers) => {
    const detected = {};
    const missing = [];
    const normalizedHeaders = headers.map(h => ({ original: h, normalized: normalize(h) }));

    // Match each alias category
    Object.entries(ALIAS_MAP).forEach(([key, aliases]) => {
        const match = normalizedHeaders.find(h => aliases.includes(h.normalized));
        if (match) {
            detected[key] = match.original;
        } else if (key !== 'brand') { // Brand is optional
            missing.push(key);
        }
    });

    return { detected, missing };
};

// @desc    Step 1 & 2: Upload and Detect Columns
// @route   POST /api/seller/bulk/upload
// @access  Private (Seller)
const uploadBulkFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Read file headers
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get only the first row (headers)
        const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];

        if (!headers || !Array.isArray(headers) || headers.length === 0) {
            return res.status(400).json({ message: 'File appears to be empty or has no headers' });
        }

        // Detect Columns
        const { detected, missing } = detectColumns(headers);
        const hasMandatory = missing.length === 0;

        // 4. Row-Level Validation (Step 3)
        const allRows = xlsx.utils.sheet_to_json(worksheet);
        const validRows = [];
        const invalidRows = [];

        allRows.forEach((row, index) => {
            const rowNumber = index + 2; // +1 for 0-index, +1 for header row
            const errors = [];

            // Only validate if headers were found, otherwise everything is missing
            if (hasMandatory) {
                // Check Product Name
                const pName = row[detected.productName];
                if (!pName || pName.toString().trim() === '') {
                    errors.push("Missing product name");
                }

                // Check Quantity
                const qty = row[detected.quantity];
                if (qty === undefined || qty === null || qty === '') {
                    errors.push("Missing quantity");
                } else if (isNaN(Number(qty)) || Number(qty) <= 0) {
                    errors.push("Invalid quantity (must be > 0)");
                }

                // Check Price
                const price = row[detected.price];
                if (price === undefined || price === null || price === '') {
                    errors.push("Missing price");
                } else if (isNaN(Number(price)) || Number(price) <= 0) {
                    errors.push("Invalid price (must be > 0)");
                }

                if (errors.length > 0) {
                    invalidRows.push({ row: rowNumber, errors });
                } else {
                    validRows.push({
                        productName: pName.toString().trim(),
                        quantity: Number(qty),
                        price: Number(price),
                        brand: row[detected.brand] || ''
                    });
                }
            } else {
                // If mandatory headers missing, entire row is invalid
                invalidRows.push({
                    row: rowNumber,
                    errors: missing.map(m => `Missing '${m}' column in Excel`)
                });
            }
        });

        // Return results to frontend
        res.json({
            message: 'File scanned successfully',
            fileName: req.file.originalname,
            fileSize: (req.file.size / 1024).toFixed(1) + ' KB',
            tempPath: req.file.path,
            mappings: detected,
            missing: missing,
            hasMandatory: hasMandatory,
            summary: {
                total: allRows.length,
                valid: validRows.length,
                invalid: invalidRows.length
            },
            validRows: validRows,
            invalidRows: invalidRows
        });
    } catch (error) {
        console.error('Bulk Upload Detection Error:', error);
        res.status(500).json({ message: 'Failed to process file. Ensure it is a valid Excel/CSV.' });
    }
};

// @desc    Step 5: Final Save Products
// @route   POST /api/seller/bulk/save
// @access  Private (Seller)
const saveBulkProducts = async (req, res) => {
    try {
        const { products, tempPath } = req.body;
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'No products provided for saving' });
        }

        const seller = await User.findById(req.user._id);
        if (!seller) return res.status(404).json({ message: 'Seller not found' });

        // Map Shop Type to Product Type
        let productType = 'STANDARD';
        if (seller.shopDetails.shopType === 'Grocery' || seller.shopDetails.shopType === 'Fruit & Veg') {
            productType = 'DAILY_ESSENTIAL';
        } else if (seller.shopDetails.shopType === 'Medical') {
            productType = 'EXPIRY_BASED';
        }

        let mergedCount = 0;
        let failedCount = 0;

        // Process products one by one for safety/duplicates
        for (const item of products) {
            try {
                const subCategory = item.subCategory || 'General';
                const identityHash = getProductIdentity({
                    name: item.productName.trim(),
                    unit: subCategory,
                    packSize: '', // XLSX typically doesn't separate packSize yet
                    brand: item.brand || ''
                });

                // Check Duplicate: Identity Match
                const existing = await Product.findOne({
                    seller: req.user._id,
                    identityHash
                });

                if (existing) {
                    const prevQty = existing.quantity || 0;
                    const addQty = Number(item.quantity);
                    existing.quantity = prevQty + addQty;

                    await StockMovement.create({
                        seller: req.user._id,
                        product: existing._id,
                        change: addQty,
                        reason: 'INITIAL_STOCK',
                        notes: `Excel Merge: ${item.productName}. Prev: ${prevQty}, Added: ${addQty}`
                    });

                    await existing.save();
                    mergedCount++;
                    continue;
                }

                // AI Category Logic
                const shopType = seller.shopDetails?.shopType || 'grocery_kirana';
                const aiResult = assignCategoryAI(item.productName.trim(), item.brand, shopType);

                // Create New Product
                await Product.create({
                    seller: req.user._id,
                    name: item.productName.trim(),
                    brand: item.brand || '',
                    sellingPrice: Number(item.price),
                    mrp: Number(item.price),
                    quantity: Number(item.quantity),
                    initialStock: Number(item.quantity),
                    category: aiResult.category || seller.shopDetails.category || 'General',
                    subCategory: subCategory || aiResult.category || 'General',
                    needsReview: aiResult.needsReview,
                    shopType,
                    productType,
                    identityHash
                });
                createdCount++;
            } catch (err) {
                console.error('Error saving bulk item:', err);
                failedCount++;
            }
        }

        // Update tracking field
        await User.findByIdAndUpdate(req.user._id, {
            'shopDetails.lastProductAddedAt': Date.now()
        });

        // Cleanup temporary file if path provided
        if (tempPath && fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath);
            } catch (err) {
                console.error('Failed to delete temp file:', err);
            }
        }

        res.json({
            message: 'Bulk processing complete',
            summary: {
                created: createdCount,
                merged: mergedCount,
                failed: failedCount
            }
        });
    } catch (error) {
        console.error('Bulk Save Error:', error);
        res.status(500).json({ message: 'Failed to save products to database' });
    }
};

module.exports = {
    uploadBulkFile,
    saveBulkProducts
};
