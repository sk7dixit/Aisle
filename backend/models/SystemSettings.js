const mongoose = require('mongoose');

const systemSettingsSchema = mongoose.Schema({
    // Section 1: Platform Control
    platformControl: {
        platformStatus: {
            type: String,
            enum: ['Live', 'Maintenance'],
            default: 'Live'
        },
        sellerOnboardingEnabled: { type: Boolean, default: true }
    },

    // Section 2: Seller Rules
    sellerRules: {
        mandatoryVerification: { type: Boolean, default: true },
        faceVerificationRequired: { type: Boolean, default: false },
        maxRejectionAttempts: { type: Number, default: 3 },
        reApplicationCooldownDays: { type: Number, default: 30 }
    },

    // Section 3: Marketplace Structure
    marketplaceStructure: {
        maxProductsPerSeller: { type: Number, default: 50 },
        categoriesEnabled: { type: Boolean, default: true } // Simplified global toggle
    },

    // Section 4: Moderation & Safety
    moderationPolicy: {
        autoFlagThreshold: { type: Number, default: 5 }, // Reports before auto-flag
        suspensionDurationDays: { type: Number, default: 14 }
    },

    // Section 5: Notifications
    notificationPolicy: {
        notifySellerOnSuspension: { type: Boolean, default: true },
        notifyCustomerOnReportResolution: { type: Boolean, default: true }
    },

    // Section 6: Security
    securityPolicy: {
        adminSessionTimeoutMinutes: { type: Number, default: 60 },
        enforceMultiAdminVisibility: { type: Boolean, default: true }
    },

    // Section 7: Audit & Compliance
    auditPolicy: {
        logRetentionDays: { type: Number, default: 365 },
        immutableLogs: { type: Boolean, default: true } // Locked
    },

    // Section 8: System Info (Read-only mapped here for structure, but likely env loaded)
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Singleton Pattern: Ensure only one settings document exists
systemSettingsSchema.statics.getInstance = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
