const Premium = require('../models/premiumModel');

exports.setPremiumAmount = async (amount) => {
  if (!amount || amount <= 0) {
    throw new Error('Invalid premium amount');
  }

  let config = await Premium.findOne();
  if (!config) {
    config = new Premium({ premiumPrice: amount });
  } else {
    config.premiumPrice = amount;
  }
  await config.save();
  return config;
};

exports.setDiscount = async (percentage, validUntil, description) => {
  if (!percentage || percentage <= 0 || percentage > 100) {
    throw new Error('Invalid discount percentage');
  }

  if (!validUntil || new Date(validUntil) <= new Date()) {
    throw new Error('Invalid discount end date');
  }

  let config = await Premium.findOne();
  if (!config) {
    throw new Error('Premium configuration not found');
  }

  config.currentDiscount = {
    percentage,
    validUntil: new Date(validUntil),
    description: description || ''
  };

  await config.save();
  return config;
};

exports.removeDiscount = async () => {
  let config = await Premium.findOne();
  if (!config) {
    throw new Error('Premium configuration not found');
  }

  config.currentDiscount = null;
  await config.save();
  return config;
};
