const mongoose = require("mongoose");

const SearchAnalyticsSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    keyword: {
        type: String,
        required: true,
        index: true
    },

    normalizedKeyword: {
        type: String,
        index: true
    },

    city: {
        type: String,
        default: "Unknown"
    },

    state: {
        type: String,
        default: "Unknown"
    },

    latitude: Number,

    longitude: Number,

    category: {
        type: String,
        default: null
    },

    resultsCount: {
        type: Number,
        default: 0
    },

    clickedProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null
    },

    clickedShopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        default: null
    },

    source: {
        type: String,
        enum: [
            "search_bar",
            "voice",
            "ai_assistant",
            "recommendation"
        ],
        default: "search_bar"
    },

    // Backward compatibility fields for legacy components
    query: {
        type: String,
        index: true
    },
    results: {
        type: Number,
        default: 0
    },
    shopType: {
        type: String,
        default: "grocery_kirana"
    },
    searchesCount: {
        type: Number,
        default: 1
    },
    clicks: {
        type: Number,
        default: 0
    },
    conversions: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
});

// Hook for mapping legacy query/results parameters to the new model format on validate
SearchAnalyticsSchema.pre("validate", function() {
    if (!this.keyword && this.query) {
        this.keyword = this.query;
    }
    if (this.keyword && !this.normalizedKeyword) {
        this.normalizedKeyword = this.keyword.trim().toLowerCase();
    }
    if (!this.query && this.keyword) {
        this.query = this.keyword;
    }
    if (this.resultsCount !== undefined && this.results === 0) {
        this.results = this.resultsCount;
    }
    if (this.results !== undefined && this.resultsCount === 0) {
        this.resultsCount = this.results;
    }
});

// Indexes (Very Important)
SearchAnalyticsSchema.index({ normalizedKeyword: 1 });
SearchAnalyticsSchema.index({ city: 1 });
SearchAnalyticsSchema.index({ createdAt: -1 });
SearchAnalyticsSchema.index({ normalizedKeyword: 1, city: 1 });

// Retention Policy (Expire documents after 180 days)
SearchAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model(
    "SearchAnalytics",
    SearchAnalyticsSchema
);
