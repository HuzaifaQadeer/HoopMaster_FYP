const cron = require('node-cron');
const challengeService = require('../services/challengeService');
const achievementService = require('../services/achievementService');
const challengeAttemptService = require('../services/challengeAttemptService');

// Run once a day at midnight
const schedule = '0 0 * * *';

const checkExpiredChallenges = async () => {
  try {
    console.log('Running expired challenges check...');
    
    // Check and update expired challenges
    const expiredChallengeIds = await challengeService.checkExpiredChallenges();
    
    console.log(`Found ${expiredChallengeIds.length} expired challenges`);
    
    // Create achievements for each expired challenge
    for (const challengeId of expiredChallengeIds) {
      try {
        console.log(`Processing expired challenge ${challengeId}...`);
        
        // Get top attempts for this challenge
        const topAttempts = await challengeAttemptService.getTopAttempts(challengeId, 3);
        
        console.log(`Found ${topAttempts.length} top attempts for challenge ${challengeId}`);
        
        if (topAttempts.length > 0) {
          // Create achievements for the top 3 users
          console.log(`Creating achievements for top ${topAttempts.length} users in challenge ${challengeId}`);
          const achievements = await achievementService.createAchievementsForChallenge(challengeId);
          console.log(`Created ${achievements.length} achievements for challenge ${challengeId}`);
          
          // Log the users who received achievements
          achievements.forEach((achievement, index) => {
            console.log(`Achievement created for user ${achievement.user} at position ${index + 1}`);
          });
        } else {
          console.log(`No attempts found for challenge ${challengeId}, skipping achievement creation`);
        }
      } catch (error) {
        console.error(`Error creating achievements for challenge ${challengeId}:`, error);
      }
    }
    
    console.log('Expired challenges check completed');
  } catch (error) {
    console.error('Error in expired challenges cron job:', error);
  }
};

// Start the cron job
const startCronJob = () => {
  cron.schedule(schedule, checkExpiredChallenges);
  console.log(`Challenge expiration cron job scheduled: ${schedule}`);
  
  // For development, you can also run it immediately
  // checkExpiredChallenges();
};

module.exports = {
  startCronJob,
  checkExpiredChallenges // Export for manual triggering
}; 