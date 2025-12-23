const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const hostelOfficeController = require('../controllers/hostelOfficeController');

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

module.exports = router;
