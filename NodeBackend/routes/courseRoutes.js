const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/all', courseController.getAllCourses);
router.get('/popular', courseController.getTopPopularCourses);
router.get('/type/:type', courseController.getCoursesByType);
router.get('/parameters', courseController.getCoursesByParameters);
router.get('/:id', courseController.getCourseById);

// Protected routes (require authentication)
router.post('/create', authMiddleware, courseController.createCourse);
router.get('/user/courses', authMiddleware, courseController.getUserCourses);
router.post('/register', authMiddleware, courseController.registerUserForCourse);
router.delete('/abandon/:courseId', authMiddleware, courseController.abandonCourse);
router.get('/:courseId/drills', authMiddleware, courseController.getCourseDrills);
router.get('/:courseId/session/:sessionNumber', authMiddleware, courseController.getCourseSessionDrills);
router.get('/:courseId/progress', authMiddleware, courseController.getCourseProgress);
router.put('/:courseId/progress/:sessionNumber', authMiddleware, courseController.updateCourseProgress);

module.exports = router;
