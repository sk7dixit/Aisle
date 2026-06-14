const mongoose = require('mongoose');

const creationRequestSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        creationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        preferredPickupTime: {
            type: String,
            required: true
        },
        message: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'ALTERNATIVE_SUGGESTED', 'COMPLETED', 'CANCELLED'],
            default: 'PENDING'
        },
        alternativeProposal: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CreationRequest', creationRequestSchema);
