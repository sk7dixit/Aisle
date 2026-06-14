const mongoose = require('mongoose');

const customerInteractionsSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            index: true
        },
        interactionType: {
            type: String,
            enum: ['view', 'click', 'reorder', 'wishlist'],
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CustomerInteractions', customerInteractionsSchema);
