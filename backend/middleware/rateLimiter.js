const rateLimit = require('express-rate-limit');

/**
 * Rate Limiters for GPEE
 * 
 * All limiters use 10 requests per 5 minutes
 * Key is based on email (for auth routes) or userId (for authenticated routes)
 * This avoids issues with college WiFi where all students share the same IP
 */

// Auth rate limiter - uses email from request body
// For: /login, /verify-otp, /signup, /forgot-password, /reset-password
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  keyGenerator: (req) => {
    // Use email as the key (case-insensitive)
    const email = req.body?.email?.toLowerCase?.() || req.body?.email;
    if (email) return `auth:${email}`;
    // Fallback to IP if no email provided
    return `auth:${req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'}`;
  },
  message: { 
    message: 'Too many attempts. Please try again in 5 minutes.',
    retryAfter: 300 // 5 minutes in seconds
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Skip validation to avoid issues with IPv6 and proxy
  validate: false,
  // Skip successful requests from counting (optional - uncomment if needed)
  // skipSuccessfulRequests: true,
});

// Gatepass creation rate limiter - uses userId from JWT token
// For: /local-gatepass, /outstation-gatepass
const gatepassLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  keyGenerator: (req) => {
    // Use authenticated user's ID
    const userId = req.user?.userId;
    if (userId) return `gatepass:${userId}`;
    // Fallback to IP (shouldn't happen as routes are protected)
    return `gatepass:${req.ip || 'unknown'}`;
  },
  message: { 
    message: 'Too many gatepass requests. Please try again in 5 minutes.',
    retryAfter: 300
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: false,
});

// QR code generation rate limiter - uses userId from JWT token
// For: /apply, /gatepass-exit, /gatepass-entry, /os-gatepass-exit, /os-gatepass-entry
const qrGenerationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  keyGenerator: (req) => {
    // Use authenticated user's ID
    const userId = req.user?.userId;
    if (userId) return `qr:${userId}`;
    // Fallback to IP (shouldn't happen as routes are protected)
    return `qr:${req.ip || 'unknown'}`;
  },
  message: { 
    message: 'Too many QR code requests. Please try again in 5 minutes.',
    retryAfter: 300
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: false,
});

module.exports = {
  authLimiter,
  gatepassLimiter,
  qrGenerationLimiter,
};
