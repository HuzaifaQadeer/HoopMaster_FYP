const Achievement = require('../models/achievementModel');
const Challenge = require('../models/challengeModel');
const challengeAttemptService = require('./challengeAttemptService');
const notificationService = require('./notificationService');

// Create achievement records for a completed challenge
exports.createAchievementsForChallenge = async (challengeId) => {
  // Get the challenge
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  // Check if challenge has ended
  const now = new Date();
  if (now < challenge.endDate) {
    throw new Error('Challenge has not ended yet');
  }
  
  // Check if achievements already exist for this challenge
  const existingAchievements = await Achievement.find({ challenge: challengeId });
  if (existingAchievements.length > 0) {
    throw new Error('Achievements already created for this challenge');
  }
  
  // Get top 3 attempts
  const topAttempts = await challengeAttemptService.getTopAttempts(challengeId, 3);
  
  if (topAttempts.length === 0) {
    console.log(`No attempts found for challenge ${challengeId}, skipping achievement creation`);
    return [];
  }
  
  console.log(`Creating achievements for top ${topAttempts.length} users in challenge ${challengeId}`);
  
  // Create achievement records
  const achievements = [];
  
  for (let i = 0; i < topAttempts.length; i++) {
    const attempt = topAttempts[i];
    const position = i + 1;
    
    console.log(`Creating achievement for user ${attempt.user._id} at position ${position}`);
    
    const achievement = new Achievement({
      user: attempt.user._id,
      challenge: challengeId,
      title: `${challenge.title} - ${getPositionText(position)}`,
      description: `Achieved ${getPositionText(position)} place in the ${challenge.title} challenge`,
      position
    });
    
    await achievement.save();
    achievements.push(achievement);
    
    // Send notification to the user
    try {
      await notificationService.createNotification({
        recipient: attempt.user._id,
        type: 'achievement',
        title: 'New Achievement!',
        message: `Congratulations! You've achieved ${getPositionText(position)} place in the ${challenge.title} challenge!`,
        data: {
          challengeId,
          achievementId: achievement._id,
          position
        }
      });
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
    }
  }
  
  // Update challenge status
  challenge.status = 'completed';
  challenge.isActive = false;
  await challenge.save();
  
  console.log(`Created ${achievements.length} achievements for challenge ${challengeId}`);
  
  return achievements;
};

// Get achievements for a user
exports.getUserAchievements = async (userId) => {
  return await Achievement.find({ user: userId })
    .populate('challenge', 'title description')
    .sort({ awardedAt: -1 });
};

// Helper function to get position text
function getPositionText(position) {
  switch (position) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return `${position}th`;
  }
} 