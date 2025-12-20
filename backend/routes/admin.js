const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const adminController = require('../controllers/adminController');

router.get('/overview', auth, requireRole(['admin']), asyncHandler(adminController.getOverview));
router.get('/logs', auth, requireRole(['admin']), asyncHandler(adminController.getLogs));
router.get('/users', auth, requireRole(['admin']), asyncHandler(adminController.getUsers));

module.exports = router;
