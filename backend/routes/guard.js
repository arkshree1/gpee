const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const guardController = require('../controllers/guardController');

router.get('/dashboard', auth, requireRole(['guard']), asyncHandler(guardController.getDashboard));
router.post('/scan', auth, requireRole(['guard']), asyncHandler(guardController.scanToken));
router.post('/decide', auth, requireRole(['guard']), asyncHandler(guardController.decide));
router.get(
	'/entry-exit-logs',
	auth,
	requireRole(['guard']),
	asyncHandler(guardController.getEntryExitLogs)
);
router.get(
	'/students',
	auth,
	requireRole(['guard']),
	asyncHandler(guardController.searchStudents)
);
router.post(
	'/manual-exit',
	auth,
	requireRole(['guard']),
	asyncHandler(guardController.manualExit)
);
router.post(
	'/manual-entry',
	auth,
	requireRole(['guard']),
	asyncHandler(guardController.manualEntry)
);

module.exports = router;
