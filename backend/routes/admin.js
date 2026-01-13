const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const adminController = require('../controllers/adminController');

router.get('/overview', auth, requireRole(['admin']), asyncHandler(adminController.getOverview));
router.get('/logs', auth, requireRole(['admin']), asyncHandler(adminController.getLogs));
router.get('/users', auth, requireRole(['admin']), asyncHandler(adminController.getUsers));
router.get('/live-logs', auth, requireRole(['admin']), asyncHandler(adminController.getLiveLogs));
router.get('/detailed-logs', auth, requireRole(['admin']), asyncHandler(adminController.getDetailedLogs));
router.get('/students-inside', auth, requireRole(['admin']), asyncHandler(adminController.getStudentsInside));
router.get('/students-outside', auth, requireRole(['admin']), asyncHandler(adminController.getStudentsOutside));
router.get('/local-gatepass-exits', auth, requireRole(['admin']), asyncHandler(adminController.getLocalGatepassExits));
router.get('/outstation-gatepass-exits', auth, requireRole(['admin']), asyncHandler(adminController.getOutstationGatepassExits));

module.exports = router;
