const mongoose = require('mongoose');

const riskProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    riskScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
        index: true
    },
    reasons: [{
        type: String
    }],
    lastCalculated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RiskProfile', riskProfileSchema);
