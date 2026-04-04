const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service', // Assuming you have a Service model or will refine this ref later
            required: true,
        },

        status: {
            type: String,
            enum: ['UPCOMING', 'COMPLETED', 'CANCELLED'],
            default: 'UPCOMING',
        },

        bookingDate: {
            type: Date,
            required: true,
        },

        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
