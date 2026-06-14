const mongoose = require('mongoose');

const weeklyReportSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    report: {
        orders: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        growth: { type: Number, default: 0 }, // percentage drop/gain
        issuesResolved: { type: Number, default: 0 },
        recommendations: { type: [String], default: [] }
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
