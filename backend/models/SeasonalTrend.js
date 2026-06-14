const mongoose = require("mongoose");

const SeasonalTrendSchema = new mongoose.Schema({
    season: {
        type: String,
        required: true,
        index: true
    },

    keyword: {
        type: String,
        required: true,
        index: true
    },

    averageSearchCount: {
        type: Number,
        default: 0
    },

    peakMonth: {
        type: Number
    },

    year: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

SeasonalTrendSchema.index({ season: 1, keyword: 1 });

module.exports = mongoose.model("SeasonalTrend", SeasonalTrendSchema);
