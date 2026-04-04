const mongoose = require('mongoose');

const AssistedListingRequestSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    isPro: {
        type: Boolean,
        default: false
    },
    estimatedProductCount: {
        type: Number
    },
    files: [{
        type: String // URLs to Cloudinary or stored files
    }],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AssistedListingRequest', AssistedListingRequestSchema);
