const mongoose = require("mongoose");

const OpportunityZoneSchema = new mongoose.Schema(
    {
        city: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        area: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        product: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        gapScore: {
            type: Number,
            default: 0
        },
        opportunity: {
            type: String,
            enum: ["low", "medium", "high", "very_high"],
            default: "low"
        }
    },
    {
        timestamps: true
    }
);

// Ensure uniqueness per city, area, and product
OpportunityZoneSchema.index({ city: 1, area: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("OpportunityZone", OpportunityZoneSchema);
