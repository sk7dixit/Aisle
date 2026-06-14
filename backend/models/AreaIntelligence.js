const mongoose = require("mongoose");

const AreaIntelligenceSchema = new mongoose.Schema(
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
        pincode: {
            type: String,
            required: true,
            index: true
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
        populationScore: {
            type: Number,
            default: 50
        },
        demandScore: {
            type: Number,
            default: 50
        },
        supplyScore: {
            type: Number,
            default: 50
        },
        trendScore: {
            type: Number,
            default: 50
        }
    },
    {
        timestamps: true
    }
);

// Ensure uniqueness per city and area
AreaIntelligenceSchema.index({ city: 1, area: 1 }, { unique: true });

module.exports = mongoose.model("AreaIntelligence", AreaIntelligenceSchema);
