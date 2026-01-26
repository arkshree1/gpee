const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const deanController = require('../controllers/deanController');

// Get Dean profile
router.get(
    '/profile',
    auth,
    requireRole(['dean']),
    asyncHandler(deanController.getProfile)
);

// Get pending outstation gatepasses (card view)
router.get(
    '/pending-gatepasses',
    auth,
    requireRole(['dean']),
    asyncHandler(deanController.getPendingGatepasses)
);

// Get single gatepass details
router.get(
    '/gatepass/:gatepassId',
    auth,
    requireRole(['dean']),
    asyncHandler(deanController.getGatepassDetails)
);

// Get student's OS gatepass history
router.get(
    '/student-history/:studentId',
    auth,
    requireRole(['dean']),
    asyncHandler(deanController.getStudentOSHistory)
);

// Get gatepass history (approved/rejected) with search
router.get(
    '/gatepass-history',
    auth,
    requireRole(['dean']),
    asyncHandler(deanController.getGatepassHistory)
);

// Approve or reject an outstation gatepass
router.post(
    '/decide-gatepass',
    auth,
    requireRole(['dean']),
    asyncHandler(deanController.decideGatepass)
);

// Send meeting email to student
router.post(
    '/send-meeting-email',
    auth,
    requireRole(['dean']),
    asyncHandler(deanController.sendMeetingEmail)
);

module.exports = router;
