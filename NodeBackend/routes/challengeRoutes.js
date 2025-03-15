const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { protect } = require('../middleware/authMiddleware');

// Admin routes
router.post('/create', protect, challengeController.createChallenge);
router.delete('/:id', protect, challengeController.deleteChallenge);
router.get('/check-expired', protect, challengeController.checkExpiredChallenges);

// Public routes
router.get('/all', challengeController.getAllChallenges);
router.get('/popular', challengeController.getTopPopularChallenges);
router.get('/active', challengeController.getActiveChallenges);
router.get('/:id', challengeController.getChallengeById);

module.exports = router;
