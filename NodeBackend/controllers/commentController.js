const Comment = require('../models/commentModel');
const Post = require('../models/postModel');

// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Verify post exists and is not deleted
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found or has been deleted' });
    }
    
    // Check if user can comment on this post (public or owned by user)
    if (post.isPrivate && post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to comment on this post' });
    }
    
    // Create and save the comment
    const comment = new Comment({
      content: content.trim(),
      post: postId,
      user: req.user._id
    });
    
    await comment.save();
    
    // Increment the comment count on the post
    post.commentCount += 1;
    await post.save();
    
    // Populate user data before sending response
    await comment.populate('user', 'displayName username profilePicture');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author or admin
    if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this comment' });
    }
    
    // Update comment
    comment.content = content.trim();
    await comment.save();
    
    // Populate user data before sending response
    await comment.populate('user', 'displayName username profilePicture');
    
    res.status(200).json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Error updating comment' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author, post owner, or admin
    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    
    // If not the comment author, check if they are the post owner
    let isPostOwner = false;
    
    if (!isCommentAuthor) {
      const post = await Post.findById(comment.post);
      isPostOwner = post && post.user.toString() === req.user._id.toString();
    }
    
    // If not comment author, post owner or admin, reject
    if (!isCommentAuthor && !isPostOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment' });
    }
    
    // Soft delete
    comment.isDeleted = true;
    await comment.save();
    
    // Decrement the comment count on the post
    const post = await Post.findById(comment.post);
    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
      await post.save();
    }
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

// Get a specific comment
exports.getComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      isDeleted: false
    }).populate('user', 'displayName username profilePicture');
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user can view the associated post
    const post = await Post.findById(comment.post);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Associated post not found or deleted' });
    }
    
    // Check permissions for private posts
    if (post.isPrivate && post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to view this comment' });
    }
    
    res.status(200).json(comment);
  } catch (error) {
    console.error('Error getting comment:', error);
    res.status(500).json({ message: 'Error retrieving comment' });
  }
};
