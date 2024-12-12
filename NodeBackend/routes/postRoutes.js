const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/all', authMiddleware, postController.getAllPosts);
router.post('/create', authMiddleware, postController.createPost);
router.get('/:id', postController.getPost);
router.get('/:id/comments', postController.getPostComments);
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;
