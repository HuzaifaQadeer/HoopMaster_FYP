const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { checkBan } = require('../middleware/banMiddleware');

// Create a new report
router.post('/create', protect, checkBan, reportController.createReport);

// Get all reports (admin only)
router.get('/', protect, reportController.getAllReports);

// Get a specific report
router.get('/:id', protect, reportController.getReport);

// Update report status (admin only)
router.put('/:id/status', protect, reportController.updateReportStatus);

module.exports = router;
