const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const proofUpload = require('../utils/proofUpload');
const studentController = require('../controllers/studentController');
const studentLogsController = require('../controllers/studentLogsController');
const localGatepassController = require('../controllers/localGatepassController');
const outstationGatepassController = require('../controllers/outstationGatepassController');

router.get('/status', auth, requireRole(['student']), asyncHandler(studentController.getStatus));
router.post('/apply', auth, requireRole(['student']), asyncHandler(studentController.apply));
router.post('/cancel', auth, requireRole(['student']), asyncHandler(studentController.cancel));
router.get('/logs', auth, requireRole(['student']), asyncHandler(studentLogsController.getMyLogs));
router.post('/local-gatepass', auth, requireRole(['student']), asyncHandler(localGatepassController.createLocalGatepass));
router.post(
	'/outstation-gatepass',
	auth,
	requireRole(['student']),
	proofUpload.single('proofFile'),
	asyncHandler(outstationGatepassController.createOutstationGatepass)
);

// Track gatepasses
router.get('/my-gatepasses', auth, requireRole(['student']), asyncHandler(studentController.getMyGatepasses));
router.post('/gatepass-exit', auth, requireRole(['student']), asyncHandler(studentController.applyGatepassExit));
router.post('/gatepass-entry', auth, requireRole(['student']), asyncHandler(studentController.applyGatepassEntry));

// Outstation gatepass QR routes
router.post('/os-gatepass-exit', auth, requireRole(['student']), asyncHandler(studentController.applyOSGatepassExit));
router.post('/os-gatepass-entry', auth, requireRole(['student']), asyncHandler(studentController.applyOSGatepassEntry));

// Outstation gatepass tracking
router.get('/my-outstation-gatepasses', auth, requireRole(['student']), asyncHandler(outstationGatepassController.getMyOutstationGatepasses));

module.exports = router;
