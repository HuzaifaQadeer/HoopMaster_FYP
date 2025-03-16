const cron = require('node-cron');
const subscriptionService = require('../services/subscriptionService');

// Schedule the job to run at midnight every day
const scheduleSubscriptionRenewalJob = () => {
  console.log('Scheduling premium subscription renewal job...');
  
  // Run at midnight (00:00) every day
  cron.schedule('0 0 * * *', async () => {
    console.log('Running premium subscription renewal job...');
    try {
      const result = await subscriptionService.checkPremiumExpiry();
      console.log(`Premium subscription renewal job completed. Processed ${result.processed} users.`);
    } catch (error) {
      console.error('Error in premium subscription renewal job:', error);
    }
  });
};

module.exports = { scheduleSubscriptionRenewalJob }; 