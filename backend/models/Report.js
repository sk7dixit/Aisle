const mongoose = require('mongoose');

const reportSchema = mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        target: {
            type: mongoose.Schema.Types.Mixed, // flexible target (User ID, Shop ID, Product ID)
            required: true
        },
        targetType: {
            type: String,
            enum: ['User', 'Shop', 'Product'],
            required: true
        },
        category: {
            type: String,
            required: true,
            enum: [
                'Fake / Duplicate Shop',
                'Incorrect Information',
                'Inappropriate Content',
                'Scam / Suspicious Activity',
                'Other'
            ]
        },
        reason: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Low'
        },
        status: {
            type: String,
            enum: ['New', 'Under Review', 'Escalated', 'Resolved'],
            default: 'New'
        },
        resolution: {
            type: String
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
