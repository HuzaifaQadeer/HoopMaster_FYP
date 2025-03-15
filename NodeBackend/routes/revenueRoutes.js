const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const { protect } = require('../middleware/authMiddleware');

router.get('/total', protect, revenueController.getTotalRevenue);
router.get('/growth/three-months', protect, revenueController.getRevenueGrowth('three-months'));
router.get('/growth/year', protect, revenueController.getRevenueGrowth('year'));
router.get('/growth/lifetime', protect, revenueController.getRevenueGrowth('lifetime'));
router.get('/subscriptions/three-months', protect, revenueController.getPremiumSubscriptions('three-months'));
router.get('/subscriptions/year', protect, revenueController.getPremiumSubscriptions('year'));
router.get('/subscriptions/lifetime', protect, revenueController.getPremiumSubscriptions('lifetime'));
router.get('/unsubscriptions/three-months', protect, revenueController.getPremiumUnsubscriptions('three-months'));
router.get('/unsubscriptions/year', protect, revenueController.getPremiumUnsubscriptions('year'));
router.get('/unsubscriptions/lifetime', protect, revenueController.getPremiumUnsubscriptions('lifetime'));

module.exports = router; 