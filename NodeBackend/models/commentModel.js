const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  content: { type: String, required: true, trim: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
commentSchema.methods.isReportedBy = function(userId) {
  return this.reports.some(report => report.reportedBy.toString() === userId.toString());
};

module.exports = mongoose.model('Comment', commentSchema);
