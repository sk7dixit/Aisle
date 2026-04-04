const mongoose = require('mongoose');

const aiLearningSchema = mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            index: true
        },
        manualCategory: {
            type: String,
            required: true
        },
        suggestedCategory: {
            type: String,
            required: true
        },
        shopType: {
            type: String,
            required: true,
            index: true
        },
        brand: {
            type: String
        },
        occurrenceCount: {
            type: Number,
            default: 1
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Grouping by product name, manual category and shop type
aiLearningSchema.index({ productName: 1, manualCategory: 1, shopType: 1 }, { unique: true });

const AILearning = mongoose.model('AILearning', aiLearningSchema);

module.exports = AILearning;
