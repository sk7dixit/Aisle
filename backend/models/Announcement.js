const mongoose = require('mongoose');

const announcementSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        target: {
            type: String,
            enum: ['All Users', 'Sellers Only', 'Buyers Only'],
            default: 'All Users'
        },
        priority: {
            type: String,
            enum: ['Normal', 'Important', 'Critical'],
            default: 'Normal'
        },
        status: {
            type: String,
            enum: ['Draft', 'Published', 'Expired'],
            default: 'Draft'
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        expiresAt: {
            type: Date
        },
        quickAction: {
            label: String,
            route: String
        }
    },
    {
        timestamps: true
    }
);

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
