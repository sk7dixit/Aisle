const mongoose = require('mongoose');

const faceUpdateRequestSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentFaceData: {
        type: String, // Base64 or URL
        required: true
    },
    newFaceData: {
        type: String, // Base64 or URL
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    adminComment: String,
    reviewedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('FaceUpdateRequest', faceUpdateRequestSchema);
