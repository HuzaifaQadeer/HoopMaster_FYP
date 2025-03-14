const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedSessions: [{
    sessionNumber: {
      type: Number,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index for userId and courseId to ensure unique progress per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress; 