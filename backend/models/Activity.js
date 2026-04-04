const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        action: {
            type: String,
            required: true,
        },

        context: {
            type: String,
            enum: ['SERVICE'], // Can be expanded later
            default: 'SERVICE',
        },

        referenceId: mongoose.Schema.Types.ObjectId, // bookingId etc.
    },
    { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
