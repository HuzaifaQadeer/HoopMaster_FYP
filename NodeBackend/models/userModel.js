const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, unique: true, sparse: true },
  userName: { type: String, unique: true, sparse: true },
  profilePicture: { type: String, default: null },
  highlightVideo: { type: String, default: null },
  socialMedia: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  height: {
    value: { type: Number, default: null },
    unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
  },
  weight: {
    value: { type: Number, default: null },
    unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
  },
  wingspan: {
    value: { type: Number, default: null },
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  position: { type: String, default: '' },
  verticalJump: {
    value: { type: Number, default: null },
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  aboutMe: { type: String, default: '' },
  isPremium: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  
  // Arrays for related data
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  drills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drill' }],
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  
  isEmailVerified: { type: Boolean, default: false },
  premiumStartDate: { type: Date, default: null },
  premiumExpiryDate: { type: Date, default: null },
  
  banStatus: {
    type: new mongoose.Schema({
      isBanned: { type: Boolean, default: false },
      banReason: { type: String, default: '' },
      banDuration: { type: Number, default: 0 },
      bannedAt: { type: Date, default: null },
      bannedUntil: { type: Date, default: null },
      bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
      banHistory: [{
        reason: { type: String, default: '' },
        duration: { type: Number, default: 0 },
        bannedAt: { type: Date },
        bannedUntil: { type: Date },
        bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
      }]
    }, { _id: false }),
    default: () => ({
      isBanned: false,
      banReason: '',
      banDuration: 0,
      bannedAt: null,
      bannedUntil: null,
      bannedBy: null,
      banHistory: []
    })
  }
}, { timestamps: true });

// Remove any existing indexes on displayName
userSchema.index({ displayName: 1 }, { unique: true, sparse: true, background: true });

module.exports = mongoose.model('User', userSchema);
