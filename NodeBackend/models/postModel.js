const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  media: {
    type: { type: String, enum: ['image', 'video', null], default: null },
    url: String
  },
  hasMedia: {
    type: Boolean,
    default: false
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  commentCount: {
    type: Number,
    default: 0
  },
  isPrivate: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['Active', 'Reported', 'Removed'],
    default: 'Active'
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

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to check if post is reported by user
postSchema.methods.isReportedBy = function(userId) {
  return this.reports.some(report => report.reportedBy.toString() === userId.toString());
};

// Method to check if post is liked by user
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(id => id.toString() === userId.toString());
};

// Add or remove like
postSchema.methods.toggleLike = function(userId) {
  const userIdStr = userId.toString();
  const index = this.likes.findIndex(id => id.toString() === userIdStr);
  
  if (index === -1) {
    this.likes.push(userId);
    return true; // liked
  } else {
    this.likes.splice(index, 1);
    return false; // unliked
  }
};

module.exports = mongoose.model('Post', postSchema);
