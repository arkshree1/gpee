const express = require('express');
const router = express.Router();

const upload = require('../utils/imageUpload');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// Signup with image upload (handle upload errors gracefully)
// Rate limited: 10 requests per 5 minutes per email
router.post('/signup', authLimiter, (req, res, next) => {
	upload.single('image')(req, res, function (err) {
		if (err) {
			return res.status(400).json({ message: err.message || 'Invalid image upload' });
		}
		return authController.signup(req, res, next);
	});
});

//heyff

// Verify OTP after signup
// Rate limited: 10 requests per 5 minutes per email
router.post('/verify-otp', authLimiter, authController.verifyOtp);

// Login
// Rate limited: 10 requests per 5 minutes per email
router.post('/login', authLimiter, authController.login);

// Forgot password - send OTP
// Rate limited: 10 requests per 5 minutes per email
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// Reset password with OTP
// Rate limited: 10 requests per 5 minutes per email
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
