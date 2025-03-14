const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const checkBan = require('../middleware/banMiddleware');

// Create a new report (requires auth + not banned)
router.post('/create', authMiddleware, checkBan, reportController.createReport);

// Get all reports (admin only)
router.get('/', authMiddleware, adminMiddleware.adminProtect, reportController.getAllReports);

// Get report by ID (admin only)
router.get('/:id', authMiddleware, adminMiddleware.adminProtect, reportController.getReport);

// Update report status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware.adminProtect, reportController.updateReportStatus);

module.exports = router;
