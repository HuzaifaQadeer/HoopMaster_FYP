const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// User subscription routes
router.post('/cancel', protect, subscriptionController.cancelSubscription);
router.get('/status', protect, subscriptionController.getSubscriptionStatus);

// Admin route for manually checking premium expiry
router.post('/check-expiry', [protect, requireAdmin], subscriptionController.checkPremiumExpiry);

module.exports = router; 