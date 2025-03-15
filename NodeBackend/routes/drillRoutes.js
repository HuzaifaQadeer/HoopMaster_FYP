const express = require('express');
const router = express.Router();
const drillController = require('../controllers/drillController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, drillController.createDrill);
router.get('/all', drillController.getAllDrills);
router.get('/popular', drillController.getTopPopularDrills);
router.get('/:id', drillController.getDrillById);

module.exports = router;