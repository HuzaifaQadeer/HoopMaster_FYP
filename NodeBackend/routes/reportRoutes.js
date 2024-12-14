const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', reportController.createReport);
router.get('/all', authMiddleware, reportController.getAllReports);
router.get('/:reportId', authMiddleware, reportController.getReportById);
router.patch('/:reportId/resolve', authMiddleware, reportController.resolveReport);


module.exports = router;
