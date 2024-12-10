const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

exports.createPost = async (userId, content, media, isPrivate = false) => {
  const post = new Post({
    user: userId,
    content,
    isPrivate
  });

  if (media) {
    const fileExtension = path.extname(media.name);
    const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const uploadPath = path.join(__dirname, '..', '..', 'Server', 'posts', uniqueFilename);

    await media.mv(uploadPath);
    post.media = {
      type: media.mimetype.startsWith('image/') ? 'image' : 'video',
      url: uniqueFilename
    };
  }

  await post.save();
  return post.populate('user', 'displayName profilePicture');
};

exports.getAllPosts = async () => {
  return await Post.find({ isPrivate: false })
    .populate('user', 'displayName profilePicture')
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'displayName profilePicture' }
    })
    .sort('-createdAt');
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
