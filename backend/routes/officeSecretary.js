const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const officeSecretaryController = require('../controllers/officeSecretaryController');

// Get Office Secretary profile (name and department)
router.get(
    '/profile',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.getProfile)
);

// Get pending outstation gatepasses (card view)
router.get(
    '/pending-gatepasses',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.getPendingGatepasses)
);

// Get single gatepass details
router.get(
    '/gatepass/:gatepassId',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.getGatepassDetails)
);

// Get student's OS gatepass history
router.get(
    '/student-history/:studentId',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.getStudentOSHistory)
);

// Get gatepass history (approved/rejected) with search
router.get(
    '/gatepass-history',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.getGatepassHistory)
);

// Approve or reject an outstation gatepass
router.post(
    '/decide-gatepass',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.decideGatepass)
);

// Edit gatepass details (leaveDays, exit/return date/time)
router.post(
    '/edit-gatepass',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.editGatepassDetails)
);

// Send meeting email to student
router.post(
    '/send-meeting-email',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.sendMeetingEmail)
);

// Update Office Secretary profile (email and/or password)
router.put(
    '/update-profile',
    auth,
    requireRole(['officeSecretary']),
    asyncHandler(officeSecretaryController.updateProfile)
);

module.exports = router;
