const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contentType: {
    type: String,
    enum: ['post', 'comment', 'user'],
    required: true
  },
  contentId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  reason: { type: String, required: true, trim: true },
  comment: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'rejected', 'actioned', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  adminAction: {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    action: String,
    date: Date,
    notes: String
  }
}, { timestamps: true });

// Create compound index to prevent duplicate reports
reportSchema.index({ contentType: 1, contentId: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema); 