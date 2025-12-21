const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const studentController = require('../controllers/studentController');
const studentLogsController = require('../controllers/studentLogsController');

router.get('/status', auth, requireRole(['student']), asyncHandler(studentController.getStatus));
router.post('/apply', auth, requireRole(['student']), asyncHandler(studentController.apply));
router.post('/cancel', auth, requireRole(['student']), asyncHandler(studentController.cancel));
router.get('/logs', auth, requireRole(['student']), asyncHandler(studentLogsController.getMyLogs));

module.exports = router;
