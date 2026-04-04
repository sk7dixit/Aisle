const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_do_not_use_in_prod';
            const decoded = jwt.verify(token, secret);

            // SECURITY: Block Partial/Temp Tokens from accessing protected routes
            if (decoded.scope === 'face_verify') {
                return res.status(403).json({ message: 'Partial token used. Complete face verification first.' });
            }

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log(`[AUTH] User not found for ID: ${decoded.id}`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            console.log(`[AUTH] User authenticated: ${req.user._id}`);
            next();
            return; // Explicit return to prevent fall-through
        } catch (error) {
            console.error('[AUTH] Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`
            });
        }
        next();
    };
};

const admin = authorize('admin');
const adminOnly = authorize('super_admin', 'admin');

module.exports = { protect, authorize, admin, adminOnly };
