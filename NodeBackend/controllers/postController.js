const postService = require('../services/postService');

exports.createPost = async (req, res) => {
  try {
    const { content, isPrivate } = req.body;
    const media = req.files?.media;
    const post = await postService.createPost(req.user.id, content, media, isPrivate);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const posts = await postService.getAllPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching posts',
      error: error.message 
    });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await postService.getPost(req.params.id);
    res.json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getPostComments = async (req, res) => {
  try {
    const comments = await postService.getPostComments(req.params.id);
    res.json(comments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const result = await postService.deletePost(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.message.includes('Not authorized') ? 403 : 400)
      .json({ message: error.message });
  }
};
