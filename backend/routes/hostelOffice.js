const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const hostelOfficeController = require('../controllers/hostelOfficeController');

// ==================== LOCAL GATEPASS ENDPOINTS ====================

// Get all pending local gatepasses
router.get(
    '/pending-gatepasses',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getPendingGatepasses)
);

// Get gatepass history (approved/denied) with search
router.get(
    '/gatepass-history',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getGatepassHistory)
);

// Get entry-exit logs
router.get(
    '/entry-exit-logs',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getEntryExitLogs)
);

// Approve or deny a gatepass
router.post(
    '/decide-gatepass',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.decideGatepass)
);

// Get student's local gatepass history
router.get(
    '/local-student-history/:studentId',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getLocalStudentHistory)
);

// ==================== OUTSTATION GATEPASS ENDPOINTS ====================

// Get pending outstation gatepasses (approved by HOD)
router.get(
    '/os-pending-gatepasses',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getOSPendingGatepasses)
);

// Get single outstation gatepass details
router.get(
    '/os-gatepass/:gatepassId',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getOSGatepassDetails)
);

// Get student's OS gatepass history
router.get(
    '/os-student-history/:studentId',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getOSStudentHistory)
);

// Get outstation gatepass history
router.get(
    '/os-gatepass-history',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.getOSGatepassHistory)
);

// Approve or reject outstation gatepass
router.post(
    '/os-decide-gatepass',
    auth,
    requireRole(['hostelOffice']),
    asyncHandler(hostelOfficeController.decideOSGatepass)
);

module.exports = router;
