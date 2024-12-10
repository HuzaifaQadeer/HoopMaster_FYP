const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, challengeController.createChallenge);
router.get('/all', challengeController.getAllChallenges);
router.delete('/:id', authMiddleware, challengeController.deleteChallenge);
router.get('/popular', challengeController.getTopPopularChallenges);

module.exports = router;
