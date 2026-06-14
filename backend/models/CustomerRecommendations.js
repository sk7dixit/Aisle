const mongoose = require('mongoose');

const customerRecommendationsSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        recommendedProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        recommendedShops: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        reason: {
            type: String,
            default: 'Based on your interests'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CustomerRecommendations', customerRecommendationsSchema);
