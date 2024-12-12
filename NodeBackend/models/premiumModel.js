const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
    premiumPrice: { type: Number, required: true },
    currentDiscount: {
      percentage: Number,
      validUntil: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Premium', appConfigSchema); 