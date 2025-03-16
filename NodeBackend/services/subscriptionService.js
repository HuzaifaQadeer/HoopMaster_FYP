const User = require('../models/userModel');
const Revenue = require('../models/revenueModel');

class SubscriptionService {
  async cancelPremium(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.isPremium) {
      throw new Error('User does not have an active premium subscription');
    }
    
    // We don't immediately remove premium status
    // Instead, we let it expire at the end of the current period
    // This is handled by the premium expiry check job
    
    // Create revenue record for cancellation
    await Revenue.create({
      userId: user._id,
      amount: 0, // No charge for cancellation
      source: 'premium_unsubscribed'
    });
    
    return { message: 'Subscription will be cancelled at the end of the current billing period' };
  }
  
  async renewPremium(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.isPremium) {
      throw new Error('User does not have an active premium subscription');
    }
    
    // Extend premium expiry date by 30 days
    user.premiumExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();
    
    // Create revenue record for renewal
    await Revenue.create({
      userId: user._id,
      amount: 9.99, // Or whatever your premium amount is
      source: 'premium_renewed'
    });
    
    return { isPremium: user.isPremium, premiumExpiryDate: user.premiumExpiryDate };
  }
  
  async checkPremiumExpiry() {
    const now = new Date();
    
    // Find users whose premium has expired
    const expiredUsers = await User.find({
      isPremium: true,
      premiumExpiryDate: { $lt: now }
    });
    
    console.log(`Found ${expiredUsers.length} users with expired premium subscriptions`);
    
    // Process each expired user
    for (const user of expiredUsers) {
      // Check if this user has cancelled their subscription
      const cancellation = await Revenue.findOne({
        userId: user._id,
        source: 'premium_unsubscribed',
        createdAt: { $gt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } // Within the last 31 days
      });
      
      if (cancellation) {
        // User has cancelled, so remove premium status
        user.isPremium = false;
        user.premiumExpiryDate = null;
        await user.save();
        console.log(`Removed premium status for user ${user._id} due to cancellation`);
      } else {
        // User has not cancelled, so renew their subscription
        try {
          await this.renewPremium(user._id);
          console.log(`Renewed premium subscription for user ${user._id}`);
        } catch (error) {
          console.error(`Error renewing premium for user ${user._id}:`, error);
        }
      }
    }
    
    return { processed: expiredUsers.length };
  }
  
  async getSubscriptionStatus(userId) {
    const user = await User.findById(userId).select('isPremium premiumStartDate premiumExpiryDate');
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      isPremium: user.isPremium,
      premiumStartDate: user.premiumStartDate,
      premiumExpiryDate: user.premiumExpiryDate
    };
  }
}

module.exports = new SubscriptionService(); 