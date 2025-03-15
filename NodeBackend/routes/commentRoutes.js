const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { checkBan } = require('../middleware/banMiddleware');

// Create a new comment (requires auth + not banned)
router.post('/create', protect, checkBan, commentController.createComment);

// Get a single comment by ID (public)
router.get('/:id', commentController.getComment);

// Update a comment (requires auth + ownership)
router.put('/:id', protect, checkBan, commentController.updateComment);

// Delete a comment (requires auth + ownership)
router.delete('/:id', protect, checkBan, commentController.deleteComment);

module.exports = router;
