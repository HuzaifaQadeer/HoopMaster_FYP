const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructions: { type: String, required: true },
  demoVideo: String,
  startDate: Date,
  endDate: Date,
  topScores: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    video: String,
    rank: { type: Number, min: 1, max: 3 } // For top 3 positions
  }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);
