const revenueService = require('../services/revenueService');

exports.getTotalRevenue = async (req, res) => {
  try {
    const revenue = await revenueService.getTotalRevenue();
    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueGrowth = (period) => {
  return async (req, res) => {
    try {
      const date = new Date();
      switch (period) {
        case 'three-months':
          date.setMonth(date.getMonth() - 3);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - 1);
          break;
        case 'lifetime':
          date.setFullYear(2000); // Set to a past date to get all records
          break;
      }
      
      const data = await revenueService.getRevenueGrowth(date);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

exports.getPremiumSubscriptions = (period) => {
  return async (req, res) => {
    try {
      const date = new Date();
      switch (period) {
        case 'three-months':
          date.setMonth(date.getMonth() - 3);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - 1);
          break;
        case 'lifetime':
          date.setFullYear(2000);
          break;
      }
      
      const data = await revenueService.getPremiumSubscriptions(date);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

exports.getPremiumUnsubscriptions = (period) => {
  return async (req, res) => {
    try {
      const date = new Date();
      switch (period) {
        case 'three-months':
          date.setMonth(date.getMonth() - 3);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - 1);
          break;
        case 'lifetime':
          date.setFullYear(2000);
          break;
      }
      
      const data = await revenueService.getPremiumUnsubscriptions(date);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}; 