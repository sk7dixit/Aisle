const mongoose = require('mongoose');

const ImageListingSessionSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        imageUrl: {
            type: String,
            required: true
        },
        detectedName: {
            type: String,
            default: null
        },
        confidence: {
            type: Number,
            default: 0
        },
        requiresManualName: {
            type: Boolean,
            default: true
        },
        aiTags: [String],
        processedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'saved', 'abandoned'],
        default: 'active'
    },
    shopType: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ImageListingSession', ImageListingSessionSchema);
