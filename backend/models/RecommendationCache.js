const mongoose = require('mongoose');

const RecommendationCacheSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        products: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },
        shops: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },
        updatedAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    }
);

module.exports = mongoose.model('RecommendationCache', RecommendationCacheSchema);
