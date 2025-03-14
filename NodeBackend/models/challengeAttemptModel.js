const mongoose = require('mongoose');

const challengeAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  videoUrl: { type: String, required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  score: { type: Number, default: 0 }, // Calculated field (upvotes - downvotes)
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a user can only attempt a challenge once
challengeAttemptSchema.index({ user: 1, challenge: 1 }, { unique: true });

// Virtual for calculating score based on upvotes and downvotes
challengeAttemptSchema.virtual('voteScore').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Pre-save hook to update the score field before saving
challengeAttemptSchema.pre('save', function(next) {
  if (this.upvotes && this.downvotes) {
    this.score = this.upvotes.length - this.downvotes.length;
  }
  next();
});

module.exports = mongoose.model('ChallengeAttempt', challengeAttemptSchema); 