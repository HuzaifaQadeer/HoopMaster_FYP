const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { checkBan } = require('../middleware/banMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get all posts with optional filters (public + auth if logged in)
router.get('/all', protect, checkBan, postController.getAllPosts);

// Create a new post (requires auth + not banned)
router.post('/create', protect, checkBan, upload.single('media'), postController.createPost);

// Get a single post by ID (public + auth if private)
router.get('/:id', protect, postController.getPost);

// Update a post (requires auth + ownership)
router.put('/:id', protect, checkBan, postController.updatePost);

// Delete a post (requires auth + ownership)
router.delete('/:id', protect, checkBan, postController.deletePost);

// Like/unlike a post (requires auth + not banned)
router.post('/:id/like', protect, checkBan, postController.toggleLike);

// Get comments for a post (public + auth if private)
router.get('/:id/comments', protect, postController.getPostComments);

// Get media for a post (public + auth if private)
router.get('/:id/media', protect, postController.getPostMedia);

module.exports = router;
