const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Admin routes
router.post('/create', authMiddleware, adminMiddleware, challengeController.createChallenge);
router.delete('/:id', authMiddleware, adminMiddleware, challengeController.deleteChallenge);
router.get('/check-expired', authMiddleware, adminMiddleware, challengeController.checkExpiredChallenges);

// Public routes
router.get('/all', challengeController.getAllChallenges);
router.get('/popular', challengeController.getTopPopularChallenges);
router.get('/active', challengeController.getActiveChallenges);
router.get('/:id', challengeController.getChallengeById);

module.exports = router;
