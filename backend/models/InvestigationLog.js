const mongoose = require('mongoose');

const investigationLogSchema = mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportSession',
        required: true,
        index: true
    },
    step: {
        type: String,
        required: true
    },
    result: {
        type: String,
        enum: ['SUCCESS', 'WARNING', 'FAIL'],
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InvestigationLog', investigationLogSchema);
