const mongoose = require('mongoose');

const resolutionHistorySchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    issue: {
        type: String, // e.g. "Product Maggi Noodles is inactive"
        required: true
    },
    fix: {
        type: String, // e.g. "Activated product in inventory"
        required: true
    },
    result: {
        type: String, // e.g. "SUCCESS", "REVERTED"
        default: 'SUCCESS'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ResolutionHistory', resolutionHistorySchema);
