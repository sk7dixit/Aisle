const mongoose = require('mongoose');

const deadLetterJobSchema = new mongoose.Schema({
    queueName: {
        type: String,
        required: true,
        index: true
    },
    jobId: {
        type: String,
        required: true
    },
    jobName: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    failedReason: {
        type: String
    },
    stacktrace: {
        type: [String]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeadLetterJob', deadLetterJobSchema);
