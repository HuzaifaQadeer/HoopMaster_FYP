const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  reason: {
    type: String,
    required: true,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'rejected', 'actioned'],
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
  }
}, { timestamps: true });

// Create compound index to prevent duplicate reports
ReportSchema.index({ contentType: 1, contentId: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('Report', ReportSchema); 