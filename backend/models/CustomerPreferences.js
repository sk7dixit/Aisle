const mongoose = require('mongoose');

const customerPreferencesSchema = mongoose.Schema(
    {
        customerId: {
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
        favoriteShops: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        avgBudget: {
            type: String,
            default: '₹500-₹1500'
        },
        preferredLocation: {
            area: String,
            lat: Number,
            lng: Number
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CustomerPreferences', customerPreferencesSchema);
