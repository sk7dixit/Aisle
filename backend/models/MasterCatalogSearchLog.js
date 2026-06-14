const mongoose = require('mongoose');

const searchLogSchema = mongoose.Schema(
{
    query: {
        type: String,
        required: true,
        index: true
    },

    resultsCount: {
        type: Number,
        default: 0
    },

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model('MasterCatalogSearchLog', searchLogSchema);
