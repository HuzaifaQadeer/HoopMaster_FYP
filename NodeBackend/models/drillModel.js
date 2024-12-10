const mongoose = require('mongoose');

const drillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructions: { type: String, required: true },
  instructionVideo: String,
  category: String,
  attempts: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    date: { type: Date, default: Date.now }
  }],
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Drill', drillSchema);
