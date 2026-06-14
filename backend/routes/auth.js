const express = require('express');
const router = express.Router();
const {
    registerUser, loginUser, sendOtp, registerShop, updateUserProfile, changePassword,
    getUserProfile, enrollFace, loginWithFace, requestFaceEnrollment,
    verifyOtpOnly, registerSellerComplete, verifySellerFace, checkUserExists,
    refreshAccessToken, getActiveSessions, revokeSession,
    setupMfa, enableMfa, disableMfa, verifyMfa, verifyElevatedMfa
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
    validateBody,
    loginSchema,
    sendOtpSchema,
    verifyOtpSchema,
    registerSchema
} = require('../middleware/validationMiddleware');
const {
    loginLimiter,
    otpLimiter,
    registerLimiter
} = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, validateBody(registerSchema), registerUser);
router.get('/check-exists', checkUserExists);
router.post('/login', loginLimiter, validateBody(loginSchema), loginUser);
router.post('/login-face', loginWithFace); // Legacy/Dev Only? Keeping for now but verify-face-login is stricter
router.post('/verify-face-login', verifySellerFace); // NEW Strict Step 2
router.post('/send-otp', otpLimiter, validateBody(sendOtpSchema), sendOtp);

// Seller Onboarding V2 Routes
router.post('/verify-otp-only', validateBody(verifyOtpSchema), verifyOtpOnly);
router.post('/register-seller-complete', upload.fields([
    { name: 'shopFront', maxCount: 1 },
    { name: 'insideView', maxCount: 1 }
]), registerSellerComplete);

router.post('/enroll-face', protect, enrollFace);

router.post('/register-shop', protect, upload.fields([
    { name: 'shopFront', maxCount: 1 },
    { name: 'insideView', maxCount: 1 },
    { name: 'productShelf', maxCount: 1 }
]), registerShop);

router.put('/profile', protect, updateUserProfile);
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword);
router.post('/face-enrollment-request', protect, requestFaceEnrollment);

// Session & Refresh Token routes
router.post('/refresh-token', refreshAccessToken);
router.get('/sessions', protect, getActiveSessions);
router.post('/sessions/revoke', protect, revokeSession);

// Multi-Factor Authentication (MFA)
router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/enable', protect, enableMfa);
router.post('/mfa/disable', protect, disableMfa);
router.post('/mfa/verify-elevated', protect, verifyElevatedMfa);
router.post('/verify-mfa', verifyMfa);

module.exports = router;
