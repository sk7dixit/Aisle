const mongoose = require("mongoose");

const InventoryHistorySchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            index: true
        },
        stockLevel: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Compound index for optimized historic stock consumption lookup
InventoryHistorySchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model("InventoryHistory", InventoryHistorySchema);
