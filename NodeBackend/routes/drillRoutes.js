const express = require('express');
const router = express.Router();
const drillController = require('../controllers/drillController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, drillController.createDrill);
router.get('/all', drillController.getAllDrills);
router.get('/popular', drillController.getTopPopularDrills);
router.get('/:id', drillController.getDrillById);

module.exports = router;