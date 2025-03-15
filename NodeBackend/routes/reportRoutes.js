const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { checkBan } = require('../middleware/banMiddleware');

// Create a new report
router.post('/create', protect, checkBan, reportController.createReport);

// Get all reports (admin only)
router.get('/', protect, reportController.getAllReports);
router.get('/all', protect, reportController.getAllReports);

// Get a specific report
router.get('/:reportId', protect, reportController.getReport);

// Resolve report (admin only)
router.patch('/:reportId/resolve', protect, reportController.resolveReport);

module.exports = router;
