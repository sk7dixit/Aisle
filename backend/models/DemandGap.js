const mongoose = require("mongoose");

const DemandGapSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true,
        index: true
    },

    city: {
        type: String,
        default: "global",
        index: true
    },

    demandScore: {
        type: Number,
        default: 0
    },

    supplyScore: {
        type: Number,
        default: 0
    },

    gapScore: {
        type: Number,
        default: 0
    },

    opportunityLevel: {
        type: String,
        enum: [
            "low",
            "medium",
            "high",
            "very_high"
        ],
        default: "low"
    }
}, {
    timestamps: true
});

DemandGapSchema.index({ keyword: 1, city: 1, gapScore: -1 });

module.exports = mongoose.model("DemandGap", DemandGapSchema);
