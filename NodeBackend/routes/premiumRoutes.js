const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');
const { protect } = require('../middleware/authMiddleware');

router.post('/set-amount', protect, premiumController.setPremiumAmount);
router.patch('/set-discount', protect, premiumController.setDiscount);
router.patch('/remove-discount', protect, premiumController.removeDiscount);
router.get('/', protect, premiumController.getPremiumConfig);

module.exports = router;
