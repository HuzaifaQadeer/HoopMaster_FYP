const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/all', courseController.getAllCourses);
router.get('/popular', courseController.getTopPopularCourses);
router.get('/type/:type', courseController.getCoursesByType);
router.get('/parameters', courseController.getCoursesByParameters);
router.get('/:id', courseController.getCourseById);

// Protected routes (require authentication)
router.post('/create', protect, courseController.createCourse);
router.get('/user/courses', protect, courseController.getUserCourses);
router.post('/register', protect, courseController.registerUserForCourse);
router.delete('/abandon/:courseId', protect, courseController.abandonCourse);
router.get('/:courseId/drills', protect, courseController.getCourseDrills);
router.get('/:courseId/session/:sessionNumber', protect, courseController.getCourseSessionDrills);
router.get('/:courseId/progress', protect, courseController.getCourseProgress);
router.put('/:courseId/progress/:sessionNumber', protect, courseController.updateCourseProgress);

module.exports = router;
