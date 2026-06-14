const mongoose = require('mongoose');

const customerRemindersSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        item: {
            type: String,
            required: true
        },
        frequency: {
            type: String,
            default: 'one-time' // e.g. monthly, every Sunday, next week, one-time
        },
        reminderDate: {
            type: Date,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CustomerReminders', customerRemindersSchema);
