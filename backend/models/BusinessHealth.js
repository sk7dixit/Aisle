const mongoose = require("mongoose");

const BusinessHealthSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 70
        },
        recommendations: {
            type: [String],
            default: []
        },
        healthBreakdown: {
            revenueGrowth: { type: Number, default: 0 },
            inventoryHealth: { type: Number, default: 0 },
            responseTime: { type: Number, default: 0 },
            conversionRate: { type: Number, default: 0 },
            demandCoverage: { type: Number, default: 0 }
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("BusinessHealth", BusinessHealthSchema);
