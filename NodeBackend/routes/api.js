const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const exerciseController = require('../controllers/exerciseController');
const challengeController = require('../controllers/challengeController');
const challengeAttemptController = require('../controllers/challengeAttemptController');
const achievementController = require('../controllers/achievementController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const reportController = require('../controllers/reportController');
const userProfileController = require('../controllers/userProfileController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const checkBan = require('../middleware/banMiddleware');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', protect, authController.logout);

// User routes
router.get('/users/me', protect, userController.getCurrentUser);
router.put('/users/me', protect, userController.updateProfile);
router.put('/users/password', protect, userController.updatePassword);
router.get('/users', protect, adminProtect, userController.getAllUsers);
router.get('/users/:id', protect, userController.getUserById);
router.delete('/users/:id', protect, adminProtect, userController.deleteUser);

// Exercise routes
router.get('/exercises', protect, exerciseController.getAllExercises);
router.get('/exercises/:id', protect, exerciseController.getExerciseById);
router.post('/exercises', protect, adminProtect, exerciseController.createExercise);
router.put('/exercises/:id', protect, adminProtect, exerciseController.updateExercise);
router.delete('/exercises/:id', protect, adminProtect, exerciseController.deleteExercise);

// Challenge routes
router.get('/challenges', protect, challengeController.getAllChallenges);
router.get('/challenges/:id', protect, challengeController.getChallengeById);
router.post('/challenges', protect, adminProtect, challengeController.createChallenge);
router.put('/challenges/:id', protect, adminProtect, challengeController.updateChallenge);
router.delete('/challenges/:id', protect, adminProtect, challengeController.deleteChallenge);

// Challenge attempt routes
router.get('/challenge-attempts', protect, challengeAttemptController.getAllAttempts);
router.get('/challenge-attempts/:id', protect, challengeAttemptController.getAttemptById);
router.post('/challenge-attempts', protect, challengeAttemptController.createAttempt);
router.put('/challenge-attempts/:id/vote', protect, challengeAttemptController.voteOnAttempt);
router.get('/challenges/:id/attempts', protect, challengeAttemptController.getAttemptsByChallenge);

// Achievement routes
router.get('/achievements', protect, achievementController.getAllAchievements);
router.get('/achievements/:id', protect, achievementController.getAchievementById);
router.get('/users/:id/achievements', protect, achievementController.getUserAchievements);

// Post routes
router.get('/posts', protect, checkBan, postController.getAllPosts);
router.get('/posts/:id', protect, checkBan, postController.getPost);
router.post('/posts', protect, checkBan, upload.single('media'), postController.createPost);
router.put('/posts/:id', protect, checkBan, postController.updatePost);
router.delete('/posts/:id', protect, checkBan, postController.deletePost);
router.post('/posts/:id/like', protect, checkBan, postController.toggleLike);
router.get('/posts/:id/comments', protect, checkBan, postController.getPostComments);
router.get('/posts/:id/media', protect, checkBan, postController.getPostMedia);

// Comment routes
router.post('/comments', protect, checkBan, commentController.createComment);
router.put('/comments/:id', protect, checkBan, commentController.updateComment);
router.delete('/comments/:id', protect, checkBan, commentController.deleteComment);
router.get('/comments/:id', protect, checkBan, commentController.getComment);

// Report routes
router.post('/reports', protect, checkBan, reportController.createReport);
router.get('/reports', protect, adminProtect, reportController.getAllReports);
router.get('/reports/:id', protect, adminProtect, reportController.getReport);
router.put('/reports/:id/status', protect, adminProtect, reportController.updateReportStatus);

// User profile routes
router.get('/users/:id/profile', protect, userProfileController.getUserProfile);
router.get('/users/:id/posts', protect, userProfileController.getUserPosts);
router.get('/users/:id/achievements', protect, userProfileController.getUserAchievements);
router.get('/users/:id/attempts', protect, userProfileController.getUserChallengeAttempts);
router.get('/users/:id/ban-status', protect, userProfileController.checkBanStatus);
router.post('/users/:id/ban', protect, adminProtect, userProfileController.banUser);
router.post('/users/:id/unban', protect, adminProtect, userProfileController.unbanUser);

module.exports = router; 