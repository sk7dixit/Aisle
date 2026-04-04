const XLSX = require("xlsx");
const crypto = require("crypto");

// ⚠️ Temp Memory Store (For Step 1 Demo)
// In production, use Redis or a temp DB collection
const tempUploads = {};

exports.initBulkUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded. Please select an Excel or CSV file." });
        }

        console.log(`[BulkUpload] Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

        // 1. Parse Buffer
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0]; // Assume first sheet
        const sheet = workbook.Sheets[sheetName];

        // 2. Convert to JSON (Array of Objects)
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
            return res.status(400).json({ message: "The uploaded file is empty or invalid." });
        }

        // 3. Extract Metadata
        const headers = Object.keys(rows[0]);
        const previewRows = rows.slice(0, 20); // First 20 rows for preview

        // 4. Generate Session ID
        const uploadId = crypto.randomUUID();

        // 5. Store in Temp Cache
        tempUploads[uploadId] = {
            filename: req.file.originalname,
            headers,
            rows,
            createdAt: Date.now(),
            sellerId: req.user._id
        };

        console.log(`[BulkUpload] ID: ${uploadId} - Rows: ${rows.length} - Headers: ${headers.join(", ")}`);

        // 6. Respond
        return res.json({
            success: true,
            uploadId,
            headers,
            previewRows,
            totalRows: rows.length,
            message: "File uploaded successfully. Proceed to mapping."
        });

    } catch (err) {
        console.error("[BulkUpload] Init Error:", err);
        res.status(500).json({ message: "Failed to process the uploaded file.", error: err.message });
    }
};

// Export the temp store to be used in Step 2 (Mapping/Save)
exports.getTempUpload = (uploadId) => tempUploads[uploadId];

// 🧠 AI Mapping Logic (Rule-Based for now)
const ALIASES = {
    name: ["product name", "item name", "name", "title", "description", "product", "items", "particulars", "item description"],
    price: ["price", "mrp", "selling price", "cost", "rate", "amount", "sale price", "unit price", "sp"],
    unit: ["unit", "uom", "unit type", "measure", "quantity unit", "pack", "size", "wt", "weight"],
    quantity: ["quantity", "qty", "stock", "count", "inventory", "qnty", "available", "opening stock"],
    brand: ["brand", "make", "manufacturer", "company"]
};

exports.suggestMapping = async (req, res) => {
    try {
        const { uploadId } = req.body;
        const session = tempUploads[uploadId];

        if (!session) {
            return res.status(404).json({ message: "Upload session expired or invalid." });
        }

        const headers = session.headers;
        const mapping = {};
        const confidence = {};

        headers.forEach(header => {
            const h = header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

            // Try to match with aliases
            for (const [field, aliasList] of Object.entries(ALIASES)) {
                if (aliasList.some(a => {
                    const cleanAlias = a.toLowerCase().replace(/[^a-z0-9]/g, "");
                    return h === cleanAlias || h.includes(cleanAlias) || cleanAlias.includes(h);
                })) {
                    // Only map if not already mapped to keep first best match
                    if (!Object.values(mapping).includes(field)) {
                        mapping[header] = field;
                    }
                    return;
                }
            }
        });

        // Return the suggestions
        res.json({
            uploadId,
            headers, // Return all headers so frontend can show them in dropdown
            suggestions: mapping,
            requiredFields: ["name", "price", "unit", "quantity"]
        });

    } catch (error) {
        console.error("[BulkUpload] Suggestion Error:", error);
        res.status(500).json({ message: "Failed to generate mapping suggestions." });
    }
};

exports.processMapping = async (req, res) => {
    try {
        const { uploadId, mapping } = req.body;
        const session = tempUploads[uploadId];

        if (!session) {
            return res.status(404).json({ message: "Upload session expired." });
        }

        // Validate Mapping
        const required = ["name", "price", "unit", "quantity"];
        const mappedFields = Object.values(mapping);
        const missing = required.filter(f => !mappedFields.includes(f));

        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
        }

        // Apply Mapping to Create Staged Products
        const { assignCategoryAI } = require('../utils/categoryAI'); // Lazy load or move to top

        const stagedProducts = session.rows.map((row, index) => {
            const product = {};
            // Map known fields
            Object.entries(mapping).forEach(([header, field]) => {
                let value = row[header];
                if (value === undefined) return;

                // Basic cleaning
                if (typeof value === 'string') value = value.trim();

                // Number conversion for specific fields
                if (["price", "quantity"].includes(field)) {
                    value = Number(String(value).replace(/[^0-9.]/g, "")) || 0;
                }

                // IGNORE EXCEL CATEGORY
                if (field === 'category') return;

                product[field] = value;
            });

            // AI CATEGORIZATION (Strict Source of Truth)
            const shopType = req.user.shopDetails?.shopType || 'grocery_kirana';
            const aiResult = assignCategoryAI(product.name || "", product.brand || "", shopType);

            product.category = aiResult.category;
            product.categorySlug = aiResult.categorySlug;
            product.subCategory = aiResult.category; // Ensure flattened structure matches
            product.needsReview = aiResult.needsReview;

            // Store original row index for reference
            product._rowIndex = index;
            // Default Status
            product._isValid = (product.name && product.price > 0 && product.quantity >= 0);

            return product;
        });

        // Store stage 2 data (or update session)
        session.stagedProducts = stagedProducts;
        session.mapping = mapping;

        res.json({
            success: true,
            count: stagedProducts.length,
            products: stagedProducts.slice(0, 50) // Return first 50 for review
        });

    } catch (error) {
        console.error("[BulkUpload] Processing Error:", error);
        res.status(500).json({ message: "Failed to process mapping." });
    }
};

const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { getProductIdentity } = require('../utils/normalizationUtils');

exports.saveFinalProducts = async (req, res) => {
    try {
        const { uploadId, products } = req.body;
        const sellerId = req.user._id;

        // Step 3 Validation: Ensure products is an array and fields are valid
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No products to save. Expected a non-empty array."
            });
        }

        // Validate each product (Strict Number & NaN check)
        for (const p of products) {
            if (!p.name || typeof p.price !== 'number' || isNaN(p.price) || typeof p.quantity !== 'number' || isNaN(p.quantity)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid data for product: ${p.name || 'Unknown'}. Price and Quantity must be valid numbers.`,
                    product: p
                });
            }
        }

        console.log(`[BulkUpload] Saving ${products.length} sanitized products for seller ${sellerId}...`);

        // 2. Prepare Operations (Bulk Write)
        const operations = products.map((p) => {
            const identityHash = getProductIdentity({
                name: p.name,
                unit: p.unit,
                packSize: '',
                brand: p.brand || ''
            });

            return {
                updateOne: {
                    filter: { seller: sellerId, identityHash },
                    update: {
                        $set: {
                            name: p.name,
                            brand: p.brand || '',
                            sellingPrice: Math.max(0, p.price),
                            mrp: Math.max(0, p.price),
                            unit: p.unit || 'Piece',
                            category: p.category || 'General Provision / Kirana',
                            categorySlug: p.categorySlug || 'general-provision',
                            subCategory: p.category || 'General Provision / Kirana',
                            shopType: req.user.shopDetails?.shopType || 'GROCERY_KIRANA',
                            identityHash,
                            needsReview: false,
                            source: 'bulk'
                        },
                        $inc: { quantity: p.quantity },
                        $setOnInsert: {
                            initialStock: p.quantity,
                            createdAt: new Date()
                        }
                    },
                    upsert: true
                }
            };
        });

        // 3. Execute Bulk Write
        try {
            console.log(`[BulkUpload] Executing bulkWrite for ${operations.length} operations...`);
            const result = await Product.bulkWrite(operations, { ordered: false });
            console.log(`[BulkUpload] bulkWrite successful:`, result.upsertedCount, "upserted,", result.modifiedCount, "modified.");

            if (tempUploads[uploadId]) {
                delete tempUploads[uploadId];
            }

            return res.json({
                success: true,
                message: "Products saved successfully.",
                summary: {
                    created: result.upsertedCount,
                    updated: result.modifiedCount,
                    matched: result.matchedCount
                }
            });
        } catch (dbErr) {
            console.error("[BulkUpload] Database Save Error:", dbErr);
            return res.status(500).json({
                success: false,
                message: "Database save failed",
                error: dbErr.message
            });
        }

    } catch (error) {
        console.error("[BulkUpload] CRITICAL SAVE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Atomic save failed. Database rejected the payload.",
            error: error.message
        });
    }
};
