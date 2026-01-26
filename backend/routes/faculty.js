const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const facultyController = require('../controllers/facultyController');

// Get all faculties (public for PhD student dropdown)
router.get(
    '/all',
    asyncHandler(facultyController.getAllFaculties)
);

// Get Faculty profile (name and department)
router.get(
    '/profile',
    auth,
    requireRole(['faculty']),
    asyncHandler(facultyController.getProfile)
);

// Get pending outstation gatepasses (card view)
router.get(
    '/pending-gatepasses',
    auth,
    requireRole(['faculty']),
    asyncHandler(facultyController.getPendingGatepasses)
);

// Get single gatepass details
router.get(
    '/gatepass/:gatepassId',
    auth,
    requireRole(['faculty']),
    asyncHandler(facultyController.getGatepassDetails)
);

// Get student's OS gatepass history
router.get(
    '/student-history/:studentId',
    auth,
    requireRole(['faculty']),
    asyncHandler(facultyController.getStudentOSHistory)
);

// Get gatepass history (approved/rejected) with search
router.get(
    '/gatepass-history',
    auth,
    requireRole(['faculty']),
    asyncHandler(facultyController.getGatepassHistory)
);

// Approve or reject an outstation gatepass
router.post(
    '/decide-gatepass',
    auth,
    requireRole(['faculty']),
    asyncHandler(facultyController.decideGatepass)
);

// Send meeting email to student
router.post(
    '/send-meeting-email',
    auth,
    requireRole(['faculty']),
    asyncHandler(facultyController.sendMeetingEmail)
);

module.exports = router;
