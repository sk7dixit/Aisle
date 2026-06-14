const mongoose = require('mongoose');

const EventIntelligenceSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['festival', 'sports', 'weather', 'local', 'holiday', 'other'],
        default: 'festival',
        index: true
    },
    city: {
        type: String,
        index: true
    },
    state: {
        type: String,
        index: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    expectedDemandImpact: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    impactScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EventIntelligence', EventIntelligenceSchema);
