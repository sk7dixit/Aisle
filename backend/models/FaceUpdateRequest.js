const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const faceUpdateRequestSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentFaceData: {
        type: String, // Base64 or URL
        required: true,
        set: (v) => v ? encrypt(v) : null,
        get: (v) => v ? decrypt(v) : null
    },
    newFaceData: {
        type: String, // Base64 or URL
        required: true,
        set: (v) => v ? encrypt(v) : null,
        get: (v) => v ? decrypt(v) : null
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
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

module.exports = mongoose.model('FaceUpdateRequest', faceUpdateRequestSchema);
