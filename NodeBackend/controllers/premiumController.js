const premiumService = require('../services/premiumService');

exports.setPremiumAmount = async (req, res) => {
  try {
    const { amount } = req.body;
    const result = await premiumService.setPremiumAmount(amount);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
 
exports.setDiscount = async (req, res) => {
  try {
    const { percentage, validUntil } = req.body;
    const result = await premiumService.setDiscount(percentage, validUntil);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeDiscount = async (req, res) => {
  try {
    const result = await premiumService.removeDiscount();
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
