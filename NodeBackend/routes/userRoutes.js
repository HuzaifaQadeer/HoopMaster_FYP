const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Define user routes here
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', authMiddleware, userController.logoutUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/toggle-privacy', authMiddleware, userController.togglePrivacy);
router.post('/upgrade-premium', authMiddleware, userController.upgradeToPremium);
router.put('/profile-picture', authMiddleware, userController.updateProfilePicture);
router.put('/highlight-video', authMiddleware, userController.updateHighlightVideo);
router.post('/courses', authMiddleware, userController.addCourse);
router.put('/courses/:courseId/progress', authMiddleware, userController.updateCourseProgress);
router.post('/achievements', authMiddleware, userController.addAchievement);

module.exports = router;