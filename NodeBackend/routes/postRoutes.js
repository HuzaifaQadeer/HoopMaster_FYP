const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const checkBan = require('../middleware/banMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get all posts with optional filters (public + auth if logged in)
router.get('/all', authMiddleware, checkBan, postController.getAllPosts);

// Create a new post (requires auth + not banned)
router.post('/create', authMiddleware, checkBan, upload.single('media'), postController.createPost);

// Get a single post by ID (public + auth if private)
router.get('/:id', authMiddleware, postController.getPost);

// Update a post (requires auth + ownership)
router.put('/:id', authMiddleware, checkBan, postController.updatePost);

// Delete a post (requires auth + ownership)
router.delete('/:id', authMiddleware, checkBan, postController.deletePost);

// Like/unlike a post (requires auth + not banned)
router.post('/:id/like', authMiddleware, checkBan, postController.toggleLike);

// Get comments for a post (public + auth if private)
router.get('/:id/comments', authMiddleware, postController.getPostComments);

// Get media for a post (public + auth if private)
router.get('/:id/media', authMiddleware, postController.getPostMedia);

module.exports = router;
