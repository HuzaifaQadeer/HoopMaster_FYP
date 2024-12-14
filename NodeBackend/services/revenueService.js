const Revenue = require('../models/revenueModel');

class RevenueService {
  async getTotalRevenue() {
    const result = await Revenue.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    return result[0]?.total || 0;
  }

  async getRevenueGrowth(startDate) {
    const revenues = await Revenue.find({
      createdAt: { $gte: startDate }
    }).sort('createdAt');

    const monthlyData = revenues.reduce((acc, revenue) => {
      const month = revenue.createdAt.toLocaleString('default', { month: 'long' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += revenue.amount;
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
  }

  async getPremiumSubscriptions(startDate) {
    const subscriptions = await Revenue.find({
      createdAt: { $gte: startDate },
      source: 'premium_subscribed'
    }).sort('createdAt');

    const monthlyData = subscriptions.reduce((acc, sub) => {
      const month = sub.createdAt.toLocaleString('default', { month: 'long' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month]++;
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count
    }));
  }

  async getPremiumUnsubscriptions(startDate) {
    const unsubscriptions = await Revenue.find({
      createdAt: { $gte: startDate },
      source: 'premium_unsubscribed'
    }).sort('createdAt');

    const monthlyData = unsubscriptions.reduce((acc, unsub) => {
      const month = unsub.createdAt.toLocaleString('default', { month: 'long' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month]++;
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count
    }));
  }

  async addRevenue(userId, amount, source) {
    const revenue = new Revenue({
      userId,
      amount,
      source
    });
    await revenue.save();
    return revenue;
  }
}

module.exports = new RevenueService(); 