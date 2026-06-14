const mongoose = require('mongoose');

const offerSchema = mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String, // percentage or flat
        required: true,
        enum: ['percentage', 'flat'],
        default: 'percentage'
    },
    value: {
        type: Number,
        required: true
    },
    match: {
        type: String, // e.g. "All Products", "Groceries"
        default: 'All Products'
    },
    status: {
        type: String,
        enum: ['Active', 'Disabled'],
        default: 'Active',
        index: true
    },
    validFrom: {
        type: Date
    },
    validUntil: {
        type: Date,
        index: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const excludeDeleted = function () {
    this.where({ deleted: { $ne: true } });
};

offerSchema.pre('find', excludeDeleted);
offerSchema.pre('findOne', excludeDeleted);
offerSchema.pre('findOneAndUpdate', excludeDeleted);
offerSchema.pre('countDocuments', excludeDeleted);

module.exports = mongoose.model('Offer', offerSchema);
