const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const studentController = require('../controllers/studentController');

router.get('/status', auth, requireRole(['student']), asyncHandler(studentController.getStatus));
router.post('/apply', auth, requireRole(['student']), asyncHandler(studentController.apply));

module.exports = router;
