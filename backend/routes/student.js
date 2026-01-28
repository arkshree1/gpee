const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { gatepassLimiter, qrGenerationLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');
const proofUpload = require('../utils/proofUpload');
const studentController = require('../controllers/studentController');
const studentLogsController = require('../controllers/studentLogsController');
const localGatepassController = require('../controllers/localGatepassController');
const outstationGatepassController = require('../controllers/outstationGatepassController');

router.get('/status', auth, requireRole(['student']), asyncHandler(studentController.getStatus));

// QR Generation - Rate limited: 10 requests per 5 minutes per user
router.post('/apply', auth, requireRole(['student']), qrGenerationLimiter, asyncHandler(studentController.apply));
router.post('/cancel', auth, requireRole(['student']), asyncHandler(studentController.cancel));
router.get('/logs', auth, requireRole(['student']), asyncHandler(studentLogsController.getMyLogs));

// Gatepass creation - Rate limited: 10 requests per 5 minutes per user
router.post('/local-gatepass', auth, requireRole(['student']), gatepassLimiter, asyncHandler(localGatepassController.createLocalGatepass));
router.delete('/local-gatepass/:gatepassId', auth, requireRole(['student']), asyncHandler(localGatepassController.deleteLocalGatepass));

// Outstation gatepass creation - Rate limited: 10 requests per 5 minutes per user
router.post(
	'/outstation-gatepass',
	auth,
	requireRole(['student']),
	gatepassLimiter,
	proofUpload.single('proofFile'),
	asyncHandler(outstationGatepassController.createOutstationGatepass)
);
router.delete('/outstation-gatepass/:gatepassId', auth, requireRole(['student']), asyncHandler(outstationGatepassController.deleteOutstationGatepass));

// Track gatepasses
router.get('/my-gatepasses', auth, requireRole(['student']), asyncHandler(studentController.getMyGatepasses));

// Gatepass QR Generation - Rate limited: 10 requests per 5 minutes per user
router.post('/gatepass-exit', auth, requireRole(['student']), qrGenerationLimiter, asyncHandler(studentController.applyGatepassExit));
router.post('/gatepass-entry', auth, requireRole(['student']), qrGenerationLimiter, asyncHandler(studentController.applyGatepassEntry));

// Outstation gatepass QR routes - Rate limited: 10 requests per 5 minutes per user
router.post('/os-gatepass-exit', auth, requireRole(['student']), qrGenerationLimiter, asyncHandler(studentController.applyOSGatepassExit));
router.post('/os-gatepass-entry', auth, requireRole(['student']), qrGenerationLimiter, asyncHandler(studentController.applyOSGatepassEntry));

// Outstation gatepass tracking
router.get('/my-outstation-gatepasses', auth, requireRole(['student']), asyncHandler(outstationGatepassController.getMyOutstationGatepasses));

module.exports = router;
