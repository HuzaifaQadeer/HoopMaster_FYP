const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'content_manager', 'moderator'],
    default: 'moderator'
  },
  lastLogin: Date,
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_content', 'manage_challenges', 'manage_courses']
  }]
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
