const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reports: [{
    type: Schema.Types.ObjectId,
    ref: 'Report'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Method to check if comment is reported by user
CommentSchema.methods.isReportedBy = function(userId) {
  return this.reports.some(report => report.reportedBy.toString() === userId.toString());
};

module.exports = mongoose.model('Comment', CommentSchema); 