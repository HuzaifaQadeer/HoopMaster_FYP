const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'expert'], 
    required: true 
  },
  duration: { 
    type: String, 
    enum: ['2 week', '1 month', '2 months'], 
    required: true 
  },
  frequency: { 
    type: String, 
    enum: ['daily', 'every 2 days', 'weekly'], 
    required: true 
  },
  thumbnail: String,
  coursedrills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseDrill' }],
  price: Number,
  isPremium: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
