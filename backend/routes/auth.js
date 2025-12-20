const express = require('express');
const router = express.Router();

const upload = require('../utils/imageUpload');
const authController = require('../controllers/authController');

// Signup with image upload (handle upload errors gracefully)
router.post('/signup', (req, res, next) => {
	upload.single('image')(req, res, function (err) {
		if (err) {
			return res.status(400).json({ message: err.message || 'Invalid image upload' });
		}
		return authController.signup(req, res, next);
	});
});

// Verify OTP after signup
router.post('/verify-otp', authController.verifyOtp);

// Login
router.post('/login', authController.login);

// Forgot password - send OTP
router.post('/forgot-password', authController.forgotPassword);

// Reset password with OTP
router.post('/reset-password', authController.resetPassword);

module.exports = router;
