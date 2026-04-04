const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            // Not required globally yet to avoid breaking existing users, but frontend will enforce it for new ones
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['customer', 'seller', 'admin', 'super_admin', 'moderator'], // Keeping 'admin' for legacy safety temporarily
            default: 'customer',
        },
        accountStatus: {
            type: String,
            enum: ['active', 'blocked', 'suspended'],
            default: 'active',
        },
        // Verification Status for Sellers
        verificationStatus: {
            type: String,
            enum: ['pending', 'approved', 'needs_review', 'rejected_by_system'],
            default: 'pending',
        },
        verificationSource: {
            type: String,
            enum: ['ai', 'admin'],
            default: 'ai',
        },
        verificationReason: {
            type: String,
            default: null,
        },
        // Optional: Shop details if the user is a seller
        shopDetails: {
            shopName: { type: String },
            address: { type: String },
            phone: { type: String },
            shopCategory: { type: String },
            category: { type: String }, // Fix for Controller/Schema mismatch
            customCategoryInput: { type: String, default: null },
            // Strict Category Logic Fields
            resolvedCategoryKey: { type: String, default: 'unmatched_other' },
            allowedSubCategories: [{ type: String }],
            shopCategories: [{ type: String }], // Array for multiple categories
            shopType: {
                type: String,
                enum: [
                    'GROCERY_KIRANA',
                    'ELECTRICAL_HARDWARE_AUTO',
                    'TECH_ACCESSORIES',
                    'STUDENT_OFFICE',
                    'HOME_LIFESTYLE',
                    'PHARMACY',
                    'HOME_BUSINESS',
                    'SEASONAL_FESTIVE',
                    'SERVICES'
                ],
                default: 'GROCERY_KIRANA'
            },
            location: {
                lat: { type: Number },
                lng: { type: Number },
                address: { type: String },
                city: { type: String } // City for context-based recommendations
            },
            shopLocation: {
                type: {
                    type: String,
                    enum: ["Point"]
                },
                coordinates: {
                    type: [Number], // [lng, lat]
                    required: false // Optional for customers, set for sellers
                },
                address: String,
                city: String
            },
            photos: [{ type: String }], // Array of URLs or filenames
            visualAssets: [{
                url: String,
                type: {
                    type: String,
                    enum: ['SHOP_FRONT', 'SHOP_INTERIOR', 'PRODUCT_SHELF', 'OWNER']
                },
                aiVerified: { type: Boolean, default: false },
                aiTags: [String],
                qualityScore: { type: Number, default: 0 },
                status: {
                    type: String,
                    enum: ['pending', 'verified', 'rejected'],
                    default: 'pending'
                },
                rejectionReason: String,
                createdAt: { type: Date, default: Date.now }
            }],
            openingHours: { type: String, default: '9:00 AM - 10:00 PM' },
            openingTime: { type: String, default: '09:00' }, // 24h format
            closingTime: { type: String, default: '20:00' }, // 24h format

            // Shop Operating Mode (Seller Control Step 1)
            operatingMode: {
                type: String,
                enum: ['GUARANTEED', 'BEST_EFFORT', 'RUSH'],
                default: 'GUARANTEED'
            },

            // New "Conceptual Model" Fields
            manualOverride: { type: Boolean, default: false }, // "WHO is in control" (True = Seller, False = Auto)
            isManuallyOpen: { type: Boolean, default: false }, // "WHAT seller wants" (True = Open, False = Closed)
            autoScheduleEnabled: { type: Boolean, default: true }, // "SHOULD time logic apply" (Redundant if manualOverride is false, but explicit is good)

            // Legacy Fields (Deprecated)
            isManuallyOffline: { type: Boolean, default: false },
            isManuallyOnline: { type: Boolean, default: false },
            declarationAccepted: { type: Boolean, default: false },
            totalVisitsToday: { type: Number, default: 0 },
            rating: { type: Number, default: 0 },
            numReviews: { type: Number, default: 0 },
            lastStockUpdateAt: { type: Date, default: Date.now },
            lastProductAddedAt: { type: Date, default: Date.now },
            autoAccept: { type: Boolean, default: false }, // New Preference
            // AI Categorization Fields
            aiSuggestedCategory: { type: String, default: null },
            aiConfidence: { type: Number, default: 0 },
            aiStatus: {
                type: String,
                enum: ['auto', 'suggested', 'unclassified', 'admin_verified'],
                default: 'unclassified'
            },
            lastDailyRestock: { type: Date, default: null }, // Auto-Reset (System)
            lastOpeningStockSetAt: { type: Date, default: null }, // Manual "Start Today" (User)

            // Payment Setup Flag (Step 1)
            paymentSetupCompleted: { type: Boolean, default: false },

            // Payment Preference (Step 3)
            acceptsOnlinePayment: { type: Boolean, default: false },

            // Payment Details (Step 4)
            paymentMethod: { type: String, enum: ['UPI'], default: 'UPI' },
            upiId: { type: String, default: null },
            paymentDisplayName: { type: String, default: null }
        },
        // Face Authentication Data (Base64 or URL)
        faceData: {
            type: String,
            default: null
        },
        identityStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'not_submitted'],
            default: 'not_submitted'
        },
        // Seller Stats for Confidence Score
        sellerStats: {
            totalRequests: { type: Number, default: 0 },
            totalResponses: { type: Number, default: 0 },
            totalDisputes: { type: Number, default: 0 },
            avgResponseTime: { type: Number, default: null }, // minutes (null means no data yet)
            responseRate: { type: Number, default: 80 }, // percentage (legacy default, will be computed)
            lastActiveAt: { type: Date, default: null },
            confidenceScore: { type: Number, default: 0 } // Computed
        },

        // Saved Addresses (Swiggy Style)
        addresses: [{
            id: { type: String }, // UUID generated on save
            itemType: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
            receiverName: { type: String, required: true },
            houseNo: { type: String, required: true },
            street: { type: String, required: true }, // Area / Colony
            landmark: { type: String },
            city: { type: String, required: true },
            state: { type: String },
            pincode: { type: String, required: true },
            coordinates: {
                lat: { type: Number, required: true },
                lng: { type: Number, required: true }
            },
            isDefault: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }],

        // Customer Specific Location & Preferences
        customerLocation: {
            area: { type: String }, // 'Connaught Place'
            city: { type: String }, // 'New Delhi'
            state: { type: String },
            pincode: { type: String },
            lat: { type: Number },
            lng: { type: Number },
            isGpsSet: { type: Boolean, default: false },
            accuracy: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
            lastUpdatedAt: { type: Date },
            addressSource: { type: String, enum: ['gps', 'manual', 'ip'], default: 'manual' }
        },
        // Detailed Discovery Preferences
        discoveryPreferences: {
            nearbyOnly: { type: Boolean, default: false },
            openShopsOnly: { type: Boolean, default: false },
            verifiedOnly: { type: Boolean, default: false },
            distanceRange: { type: Number, default: 5 } // km
        },
        // Notification Preferences
        notificationPreferences: {
            shopUpdates: { type: Boolean, default: true },
            itemAlerts: { type: Boolean, default: true },
            paymentAlerts: { type: Boolean, default: true },
            announcements: { type: Boolean, default: false }
        },
        language: {
            type: String,
            enum: ['en', 'hi', 'regional'],
            default: 'en'
        },
        // Memory / Continuity
        interestedIntents: [{
            label: { type: String }, // e.g., "Need groceries now"
            addedAt: { type: Date, default: Date.now }
        }],

        // --- SUBSCRIPTION & VISIBILITY ---
        subscription: {
            planId: {
                type: String,
                enum: ['free', 'growth', 'pro'],
                default: 'free'
            },
            isActive: { type: Boolean, default: true },
            startDate: { type: Date, default: Date.now },
            endDate: { type: Date, default: null } // Null means indefinite (for free plan) or lifetime
        },

        visibilityBoost: {
            isActive: { type: Boolean, default: false },
            boostType: { type: String, enum: ['daily', 'weekly', null], default: null },
            startDate: { type: Date, default: null },
            endDate: { type: Date, default: null }
        }

    },
    {
        timestamps: true,
    }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.index({ "shopDetails.shopLocation": "2dsphere" }, { sparse: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
