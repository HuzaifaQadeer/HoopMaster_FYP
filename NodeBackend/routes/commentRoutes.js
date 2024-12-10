const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, commentController.addComment);
router.get('/:id', commentController.getComment);

module.exports = router;
