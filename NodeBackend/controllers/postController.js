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
    const posts = await postService.getAllPosts();
    res.json(posts);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
