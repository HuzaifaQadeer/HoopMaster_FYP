const Comment = require('../models/commentModel');
const Post = require('../models/postModel');

exports.addComment = async (userId, postId, content) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const comment = new Comment({
    user: userId,
    post: postId,
    content
  });

  await comment.save();
  
  post.comments.push(comment._id);
  await post.save();

  return await comment.populate('user', 'displayName profilePicture');
};

exports.getComment = async (commentId) => {
  const comment = await Comment.findById(commentId)
    .populate('user', 'displayName profilePicture')
    .populate('post');

  if (!comment) {
    throw new Error('Comment not found');
  }

  return comment;
};

exports.deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  
  if (!comment) {
    throw new Error('Comment not found');
  }

  // Check if user is the comment owner
  if (comment.user.toString() !== userId) {
    throw new Error('Not authorized to delete this comment');
  }

  // Remove comment reference from the post
  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: commentId }
  });

  // Delete the comment
  await Comment.findByIdAndDelete(commentId);

  return { message: 'Comment deleted successfully' };
};
