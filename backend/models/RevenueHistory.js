const mongoose = require("mongoose");

const RevenueHistorySchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        revenue: {
            type: Number,
            default: 0
        },
        orders: {
            type: Number,
            default: 0
        },
        requests: {
            type: Number,
            default: 0
        },
        conversions: {
            type: Number,
            default: 0
        },
        date: {
            type: String, // format YYYY-MM-DD
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Ensure uniqueness per seller and date
RevenueHistorySchema.index({ sellerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("RevenueHistory", RevenueHistorySchema);
