const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/set-amount', authMiddleware, premiumController.setPremiumAmount);
router.patch('/set-discount', authMiddleware, premiumController.setDiscount);
router.patch('/remove-discount', authMiddleware, premiumController.removeDiscount);

module.exports = router;
