const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructions: { type: String, required: true },
  demoVideo: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  topScores: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    video: String,
    rank: { type: Number, min: 1, max: 3 } // For top 3 positions
  }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participantCount: { type: Number, default: 0 }, // Cached count for faster querying
  isActive: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'completed'], 
    default: 'upcoming' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  thumbnail: { type: String } // URL to challenge thumbnail image
}, { timestamps: true });

// Virtual for checking if challenge is active
challengeSchema.virtual('isExpired').get(function() {
  return this.endDate < new Date();
});

// Update challenge status based on dates
challengeSchema.pre('save', function(next) {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  } else {
    this.status = 'completed';
  }
  next();
});

module.exports = mongoose.model('Challenge', challengeSchema);
