const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, reportController.createReport);
router.get('/all', authMiddleware, reportController.getAllReports);

module.exports = router;
