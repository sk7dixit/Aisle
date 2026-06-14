const mongoose = require('mongoose');

const resolutionActionSchema = mongoose.Schema({
    actionType: {
        type: String,
        required: true,
        index: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    targetId: {
        type: String, // String representation of the target (product, shop, or offer ID)
        required: true,
        index: true
    },
    targetName: {
        type: String,
        required: true
    },
    previousState: {
        type: mongoose.Schema.Types.Mixed, // Stores snapshot of properties before modification
        default: {}
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'UNDONE', 'FAILED'],
        default: 'SUCCESS',
        index: true
    },
    performedBy: {
        type: String,
        enum: ['SUPPORT_AI', 'USER'],
        default: 'SUPPORT_AI'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ResolutionAction', resolutionActionSchema);
