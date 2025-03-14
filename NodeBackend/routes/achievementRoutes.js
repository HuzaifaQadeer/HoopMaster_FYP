const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const challengeExpirationCron = require('../cron/challengeExpiration');

// Get a user's achievements (requires authentication)
router.get('/user', 
  authMiddleware, 
  achievementController.getUserAchievements
);

// Create achievements for a completed challenge (admin only)
router.post('/challenge/:challengeId', 
  authMiddleware,  
  achievementController.createAchievementsForChallenge
);

// Manually trigger the challenge expiration check (admin only)
router.post('/check-expired-challenges',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await challengeExpirationCron.checkExpiredChallenges();
      res.json({ message: 'Challenge expiration check completed' });
    } catch (error) {
      console.error('Error triggering challenge expiration check:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router; 