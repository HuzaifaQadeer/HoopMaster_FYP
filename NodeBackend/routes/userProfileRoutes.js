const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const userProfileController = require('../controllers/userProfileController');

router.get('/:id/profile', protect, userProfileController.getUserProfile);
router.get('/:id/posts', protect, userProfileController.getUserPosts);
router.get('/:id/achievements', protect, userProfileController.getUserAchievements);
router.get('/:id/attempts', protect, userProfileController.getUserChallengeAttempts);
router.get('/:id/ban-status', protect, userProfileController.checkBanStatus);
router.post('/:id/ban', protect, userProfileController.banUser);
router.post('/:id/unban', protect, userProfileController.unbanUser);

module.exports = router; 