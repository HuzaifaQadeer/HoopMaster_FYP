const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
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
  mediaUrl: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', null],
    default: null
  },
  hasMedia: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
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
PostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to check if post is reported by user
PostSchema.methods.isReportedBy = function(userId) {
  return this.reports.some(report => report.reportedBy.toString() === userId.toString());
};

// Method to check if post is liked by user
PostSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(id => id.toString() === userId.toString());
};

// Add or remove like
PostSchema.methods.toggleLike = function(userId) {
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

module.exports = mongoose.model('Post', PostSchema); 