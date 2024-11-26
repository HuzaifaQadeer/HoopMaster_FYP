const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined  // This ensures the field is not set if no value is provided
  },
  userName: { type: String, unique: true, sparse: true },
  profilePicture: String,
  profileVideo: String,
  socialMedia: {
    instagram: String,
    facebook: String,
    youtube: String,
    twitter: String
  },
  height: {
    value: Number,
    unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
  },
  weight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
  },
  wingspan: {
    value: Number,
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  position: String,
  verticalJump: {
    value: Number,
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  aboutMe: String,
  isPremium: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  highlightVideo: String,
  courses: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    progress: { type: Number, min: 0, max: 100, default: 0 }, // Progress in percentage
    lastAccessed: { type: Date, default: Date.now }
  }],
  drills: [{
    drill: { type: mongoose.Schema.Types.ObjectId, ref: 'Drill' },
    perfectScore: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    lastAttempted: { type: Date, default: Date.now }
  }],
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  comments: [{
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
  }],
  attemptedChallenges: [{
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    score: Number,
    submissionVideo: String,
    attemptDate: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Remove any existing indexes on displayName
userSchema.index({ displayName: 1 }, { unique: true, sparse: true, background: true });

module.exports = mongoose.model('User', userSchema);
