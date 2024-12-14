const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

exports.createPost = async (userId, content, media, isPrivate = false) => {
  try {
    const post = new Post({
      user: userId,
      content,
      isPrivate
    });

    await post.save();
    
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'displayName email profilePicture')
      .lean();

    return {
      id: populatedPost._id,
      content: populatedPost.content,
      status: populatedPost.status || 'Active',
      date: populatedPost.createdAt,
      author: populatedPost.user?.displayName || 'Unknown User',
      user: {
        id: populatedPost.user?._id,
        displayName: populatedPost.user?.displayName || 'Unknown User',
        email: populatedPost.user?.email || '',
        profilePicture: populatedPost.user?.profilePicture || null
      }
    };
  } catch (error) {
    console.error('Error in createPost:', error);
    throw error;
  }
};

exports.getAllPosts = async () => {
  return await Post.find({ isPrivate: false })
    .populate('user', 'displayName email profilePicture')
    .sort('-createdAt')
    .lean()
    .then(posts => posts.map(post => ({
      id: post._id,
      content: post.content,
      status: post.status || 'Active',
      date: post.createdAt,
      author: post.user?.displayName || 'Unknown User',
      user: {
        id: post.user?._id,
        displayName: post.user?.displayName || 'Unknown User',
        email: post.user?.email || '',
        profilePicture: post.user?.profilePicture || null
      }
    })));
};

exports.getPost = async (postId) => {
  const post = await Post.findById(postId)
    .populate('user', 'displayName profilePicture')
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'displayName profilePicture' }
    });

  if (!post) {
    throw new Error('Post not found');
  }
  return post;
};

exports.getPostComments = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  return await Comment.find({ post: postId })
    .populate('user', 'displayName profilePicture')
    .sort('-createdAt');
};

exports.deletePost = async (postId) => {
  const post = await Post.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }

  // Delete associated media if exists
  if (post.media && post.media.url) {
    const mediaPath = path.join(__dirname, '..', '..', 'Server', 'posts', post.media.url);
    await fs.unlink(mediaPath).catch(err => 
      console.error('Error deleting post media:', err)
    );
  }

  // Delete all comments associated with the post
  await Comment.deleteMany({ post: postId });

  // Delete the post
  await Post.findByIdAndDelete(postId);

  return { message: 'Post deleted successfully' };
};
