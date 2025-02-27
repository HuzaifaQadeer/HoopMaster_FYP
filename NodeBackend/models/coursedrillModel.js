const mongoose = require('mongoose');
const courseDrillSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  order: { type: Number, required: true }, // Sequence in the course
  session: { type: Number, required: true }, // Sequence in the session
  type: { 
    type: String, 
    enum: ['Handles', 'Finishing', 'Shooting'], 
    required: true 
  },
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'expert'], 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('CourseDrill', courseDrillSchema);