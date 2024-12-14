const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/total', authMiddleware, revenueController.getTotalRevenue);
router.get('/growth/three-months', authMiddleware, revenueController.getRevenueGrowth('three-months'));
router.get('/growth/year', authMiddleware, revenueController.getRevenueGrowth('year'));
router.get('/growth/lifetime', authMiddleware, revenueController.getRevenueGrowth('lifetime'));
router.get('/subscriptions/three-months', authMiddleware, revenueController.getPremiumSubscriptions('three-months'));
router.get('/subscriptions/year', authMiddleware, revenueController.getPremiumSubscriptions('year'));
router.get('/subscriptions/lifetime', authMiddleware, revenueController.getPremiumSubscriptions('lifetime'));
router.get('/unsubscriptions/three-months', authMiddleware, revenueController.getPremiumUnsubscriptions('three-months'));
router.get('/unsubscriptions/year', authMiddleware, revenueController.getPremiumUnsubscriptions('year'));
router.get('/unsubscriptions/lifetime', authMiddleware, revenueController.getPremiumUnsubscriptions('lifetime'));

module.exports = router; 