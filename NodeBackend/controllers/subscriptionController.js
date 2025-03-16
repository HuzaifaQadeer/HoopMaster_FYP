const subscriptionService = require('../services/subscriptionService');

exports.cancelSubscription = async (req, res) => {
  try {
    const result = await subscriptionService.cancelPremium(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const result = await subscriptionService.getSubscriptionStatus(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkPremiumExpiry = async (req, res) => {
  try {
    const result = await subscriptionService.checkPremiumExpiry();
    res.json({ message: 'Premium expiry check completed', result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 