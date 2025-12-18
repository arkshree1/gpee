const express = require('express');
const router = express.Router();

const upload = require('../utils/imageUpload');
const authController = require('../controllers/authController');

// Signup with image upload
router.post('/signup', upload.single('image'), authController.signup);

// Verify OTP after signup
router.post('/verify-otp', authController.verifyOtp);

// Login
router.post('/login', authController.login);

// Forgot password - send OTP
router.post('/forgot-password', authController.forgotPassword);

// Reset password with OTP
router.post('/reset-password', authController.resetPassword);

module.exports = router;
