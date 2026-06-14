const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    requestCount: {
        type: Number,
        default: 1,
    },
    verifyCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // The document will be automatically deleted after 10 minutes (600 seconds)
    },
});

module.exports = mongoose.model('Otp', otpSchema);
