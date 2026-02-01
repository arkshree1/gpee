/**
 * Middleware to check if a student is banned
 * This middleware should be applied to routes that students should not access if banned:
 * - Creating local gatepasses
 * - Creating outstation gatepasses
 * - Applying for exit/entry
 * 
 * SECURITY: This check is enforced at the database level - cannot be bypassed by API manipulation
 */

const User = require('../models/User');

const checkBan = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Always fetch fresh data from database - prevents any caching/token manipulation
    const student = await User.findById(userId).select('isBanned banReason role');

    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only apply ban check to students
    if (student.role !== 'student') {
      return next();
    }

    // Check if student is banned
    if (student.isBanned === true) {
      console.log(`[SECURITY] Banned student ${userId} attempted to access restricted endpoint`);
      return res.status(403).json({
        message: 'Your account has been suspended. You cannot apply for gatepasses or exit requests.',
        reason: student.banReason || 'Contact administration for details.',
        isBanned: true,
      });
    }

    next();
  } catch (error) {
    console.error('[checkBan] Error checking ban status:', error);
    return res.status(500).json({ message: 'Unable to verify account status' });
  }
};

module.exports = checkBan;
