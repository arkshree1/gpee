const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const dugcController = require('../controllers/dugcController');

// Get DUGC profile (name and department)
router.get(
    '/profile',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.getProfile)
);

// Get pending outstation gatepasses (card view)
router.get(
    '/pending-gatepasses',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.getPendingGatepasses)
);

// Get single gatepass details
router.get(
    '/gatepass/:gatepassId',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.getGatepassDetails)
);

// Get student's OS gatepass history
router.get(
    '/student-history/:studentId',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.getStudentOSHistory)
);

// Get gatepass history (approved/rejected) with search
router.get(
    '/gatepass-history',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.getGatepassHistory)
);

// Approve or reject an outstation gatepass
router.post(
    '/decide-gatepass',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.decideGatepass)
);

// Send meeting email to student
router.post(
    '/send-meeting-email',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.sendMeetingEmail)
);

// Update DUGC profile (email and/or password)
router.put(
    '/update-profile',
    auth,
    requireRole(['dugc']),
    asyncHandler(dugcController.updateProfile)
);

module.exports = router;
