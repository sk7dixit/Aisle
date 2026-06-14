const mongoose = require("mongoose");

const DemandHistorySchema = new mongoose.Schema(
    {
        keyword: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },
        city: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        date: {
            type: String, // format YYYY-MM-DD
            required: true,
            index: true
        },
        searchCount: {
            type: Number,
            default: 0
        },
        clickCount: {
            type: Number,
            default: 0
        },
        requestCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Unique compound index on keyword + city + date to prevent duplicate daily summaries
DemandHistorySchema.index({ keyword: 1, city: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DemandHistory", DemandHistorySchema);
