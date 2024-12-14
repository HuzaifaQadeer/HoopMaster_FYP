const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true 
  },
  source: { 
    type: String, 
    enum: ['premium_subscribed', 'premium_renewed', 'premium_unsubscribed'],
    required: true 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Revenue', revenueSchema); 