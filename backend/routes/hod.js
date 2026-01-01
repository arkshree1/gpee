const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const hodController = require('../controllers/hodController');

// Get pending outstation gatepasses (card view)
router.get(
    '/pending-gatepasses',
    auth,
    requireRole(['hod']),
    asyncHandler(hodController.getPendingGatepasses)
);

// Get single gatepass details
router.get(
    '/gatepass/:gatepassId',
    auth,
    requireRole(['hod']),
    asyncHandler(hodController.getGatepassDetails)
);

// Get student's OS gatepass history
router.get(
    '/student-history/:studentId',
    auth,
    requireRole(['hod']),
    asyncHandler(hodController.getStudentOSHistory)
);

// Get gatepass history (approved/rejected) with search
router.get(
    '/gatepass-history',
    auth,
    requireRole(['hod']),
    asyncHandler(hodController.getGatepassHistory)
);

// Approve or reject an outstation gatepass
router.post(
    '/decide-gatepass',
    auth,
    requireRole(['hod']),
    asyncHandler(hodController.decideGatepass)
);

module.exports = router;
