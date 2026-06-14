const mongoose = require('mongoose');

const businessTasksSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    task: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['HIGH', 'MEDIUM', 'LOW'],
        default: 'MEDIUM'
    },
    action: {
        type: String,
        required: false
    },
    targetId: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BusinessTasks', businessTasksSchema);
