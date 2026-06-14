const mongoose = require('mongoose');

const growthRoadmapSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    score: {
        type: Number,
        default: 0
    },
    nextMilestones: [
        {
            step: { type: Number, required: true },
            title: { type: String, required: true },
            points: { type: Number, required: true },
            completed: { type: Boolean, default: false }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('GrowthRoadmap', growthRoadmapSchema);
