const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  title: { type: String, required: true },
  description: { type: String },
  position: { type: Number, min: 1, max: 3, required: true },
  awardedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure uniqueness for user, challenge, and position
achievementSchema.index({ challenge: 1, position: 1 }, { unique: true });
achievementSchema.index({ user: 1, challenge: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema); 