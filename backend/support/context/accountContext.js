const User = require('../../models/User');

/**
 * Compiles account-related status verification fields for the seller.
 */
const getAccountContext = async (sellerId) => {
    try {
        const user = await User.findById(sellerId).lean();
        if (!user) {
            return {
                accountStatus: 'UNKNOWN',
                verificationStatus: 'UNKNOWN',
                phoneVerified: false,
                emailVerified: false
            };
        }

        return {
            sellerId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            accountStatus: user.accountStatus || 'active', // active, blocked, suspended
            verificationStatus: user.verificationStatus || 'pending', // pending, approved, needs_review, rejected_by_system
            identityStatus: user.identityStatus || 'not_submitted', // pending, verified, rejected, not_submitted
            phoneVerified: !!user.phone,
            emailVerified: true // Session is active, so email is verified
        };
    } catch (error) {
        console.error('Error in accountContext:', error);
        return {
            accountStatus: 'ERROR',
            verificationStatus: 'ERROR',
            phoneVerified: false,
            emailVerified: false,
            error: error.message
        };
    }
};

module.exports = getAccountContext;
