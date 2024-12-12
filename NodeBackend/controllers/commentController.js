const commentService = require('../services/commentService');

exports.addComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const comment = await commentService.addComment(req.user.id, postId, content);
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getComment = async (req, res) => {
  try {
    const comment = await commentService.getComment(req.params.id);
    res.json(comment);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const result = await commentService.deleteComment(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.message.includes('Not authorized') ? 403 : 400)
      .json({ message: error.message });
  }
};
