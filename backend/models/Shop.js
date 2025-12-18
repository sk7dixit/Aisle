const mongoose = require('mongoose');

const shopSchema = mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shopName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        address: {
            type: String,
            required: true,
        },
        // GeoJSON for location-based search
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                index: '2dsphere', // Create a geospatial index
            },
        },
        contactPhone: {
            type: String,
            required: true,
        },
        isOpen: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    }
);

shopSchema.index({ location: '2dsphere' });

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
