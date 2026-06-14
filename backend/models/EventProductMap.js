const mongoose = require('mongoose');

const EventProductMapSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    products: {
        type: [String],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EventProductMap', EventProductMapSchema);
