const mongoose = require('mongoose');

const courseDrillSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  drill: { type: mongoose.Schema.Types.ObjectId, ref: 'Drill', required: true },
  order: { type: Number, required: true }, // Sequence in the course
  requiredScore: Number,
  instructions: String
}, { timestamps: true });

module.exports = mongoose.model('CourseDrill', courseDrillSchema);
