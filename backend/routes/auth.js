const express = require('express');
const router = express.Router();
const {
    registerUser, loginUser, sendOtp, registerShop, updateUserProfile, changePassword,
    getUserProfile, enrollFace, loginWithFace, requestFaceEnrollment,
    verifyOtpOnly, registerSellerComplete, verifySellerFace, checkUserExists
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/register', registerUser);
router.get('/check-exists', checkUserExists);
router.post('/login', loginUser);
router.post('/login-face', loginWithFace); // Legacy/Dev Only? Keeping for now but verify-face-login is stricter
router.post('/verify-face-login', verifySellerFace); // NEW Strict Step 2
router.post('/send-otp', sendOtp);

// Seller Onboarding V2 Routes
router.post('/verify-otp-only', verifyOtpOnly);
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

module.exports = router;
