const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true, unique: true },
  userName: { type: String},
  profilePicture: String,
  socialMedia: {
    instagram: String,
    facebook: String,
    youtube: String,
    twitter: String
  },
  height: {
    value: Number,
    unit: { type: String, enum: ['cm', 'ft'] }
  },
  weight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'lbs'] }
  },
  wingspan: {
    value: Number,
    unit: { type: String, enum: ['cm', 'in'] }
  },
  position: String,
  verticalJump: {
    value: Number,
    unit: { type: String, enum: ['cm', 'in'] }
  },
  aboutMe: String,
  isPremium: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  highlightVideo: String,
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
