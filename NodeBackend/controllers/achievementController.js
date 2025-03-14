const achievementService = require('../services/achievementService');

// Get a user's achievements
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const achievements = await achievementService.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(400).json({ message: error.message });
  }
};

// Create achievements for a completed challenge
exports.createAchievementsForChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    // Create achievements for the top 3 users
    const achievements = await achievementService.createAchievementsForChallenge(challengeId);
    
    res.json({
      message: `Created ${achievements.length} achievements for challenge`,
      achievements
    });
  } catch (error) {
    console.error('Error creating achievements for challenge:', error);
    res.status(400).json({ message: error.message });
  }
}; 