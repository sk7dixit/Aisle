const mongoose = require('mongoose');

const supportContextSnapshotSchema = mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'SupportTicket',
        unique: true,
        index: true
    },
    context: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SupportContextSnapshot', supportContextSnapshotSchema);
