const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const dpgcController = require('../controllers/dpgcController');

// Get DPGC profile (name and department)
router.get(
    '/profile',
    auth,
    requireRole(['dpgc']),
    asyncHandler(dpgcController.getProfile)
);

// Get pending outstation gatepasses (card view)
router.get(
    '/pending-gatepasses',
    auth,
    requireRole(['dpgc']),
    asyncHandler(dpgcController.getPendingGatepasses)
);

// Get single gatepass details
router.get(
    '/gatepass/:gatepassId',
    auth,
    requireRole(['dpgc']),
    asyncHandler(dpgcController.getGatepassDetails)
);

// Get student's OS gatepass history
router.get(
    '/student-history/:studentId',
    auth,
    requireRole(['dpgc']),
    asyncHandler(dpgcController.getStudentOSHistory)
);

// Get gatepass history (approved/rejected) with search
router.get(
    '/gatepass-history',
    auth,
    requireRole(['dpgc']),
    asyncHandler(dpgcController.getGatepassHistory)
);

// Approve or reject an outstation gatepass
router.post(
    '/decide-gatepass',
    auth,
    requireRole(['dpgc']),
    asyncHandler(dpgcController.decideGatepass)
);

// Send meeting email to student
router.post(
    '/send-meeting-email',
    auth,
    requireRole(['dpgc']),
    asyncHandler(dpgcController.sendMeetingEmail)
);

module.exports = router;
