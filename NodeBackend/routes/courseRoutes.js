const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, courseController.createCourse);
router.get('/all', courseController.getAllCourses);
router.get('/popular', courseController.getTopPopularCourses);

module.exports = router;
