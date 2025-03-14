const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const checkBan = require('../middleware/banMiddleware');

// Create a new comment (requires auth + not banned)
router.post('/create', authMiddleware, checkBan, commentController.createComment);

// Get a single comment by ID (public + auth if private post)
router.get('/:id', authMiddleware, commentController.getComment);

// Update a comment (requires auth + ownership)
router.put('/:id', authMiddleware, checkBan, commentController.updateComment);

// Delete a comment (requires auth + ownership)
router.delete('/:id', authMiddleware, checkBan, commentController.deleteComment);

module.exports = router;
