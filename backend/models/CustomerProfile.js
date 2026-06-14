const mongoose = require('mongoose');

const CustomerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        favoriteCategories: {
            type: [String],
            default: []
        },
        favoriteProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        favoriteShops: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        searchPatterns: {
            type: [String],
            default: []
        },
        requestPatterns: {
            type: [String],
            default: []
        },
        activeHours: {
            type: [Number],
            default: []
        },
        city: {
            type: String,
            default: ''
        },
        categoryScores: {
            type: Map,
            of: Number,
            default: {}
        },
        interests: {
            type: [String],
            default: []
        },
        segment: {
            type: String,
            default: 'Grocery',
            index: true
        },
        profileScore: {
            type: Number,
            default: 0
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CustomerProfile', CustomerProfileSchema);
