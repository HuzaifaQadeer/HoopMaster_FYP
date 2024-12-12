const Premium = require('../models/premiumModel');

exports.setPremiumAmount = async (amount) => {
  if (!amount || amount <= 0) {
    throw new Error('Invalid premium amount');
  }

  const config = await Premium.findOneAndUpdate(
    {}, // Find the first document
    { premiumPrice: amount }, // Update the premiumPrice
    { new: true, upsert: true } // Return the updated document, create if not found
  );

  return config;
};

exports.setDiscount = async (percentage, validUntil) => {
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
    validUntil: new Date(validUntil)
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

exports.getPremiumConfig = async () => {
  const config = await Premium.findOne();
  if (!config) {
    throw new Error('Premium configuration not found');
  }
  return config;
};
