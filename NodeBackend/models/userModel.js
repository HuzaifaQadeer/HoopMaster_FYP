const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, unique: true, sparse: true },
  userName: { type: String, unique: true, sparse: true },
  profilePicture: String,
  highlightVideo: String,
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
  
  // Arrays for related data
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  drills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drill' }],
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  
  isEmailVerified: { type: Boolean, default: false },
  premiumStartDate: Date,
  premiumExpiryDate: Date,
  
  banStatus: {
    isBanned: { type: Boolean, default: false },
    banReason: String,
    banDuration: Number, // in days
    bannedAt: Date,
    bannedUntil: Date,
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    banHistory: [{
      reason: String,
      duration: Number,
      bannedAt: Date,
      bannedUntil: Date,
      bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
    }]
  }
}, { timestamps: true });

// Remove any existing indexes on displayName
userSchema.index({ displayName: 1 }, { unique: true, sparse: true, background: true });

module.exports = mongoose.model('User', userSchema);
