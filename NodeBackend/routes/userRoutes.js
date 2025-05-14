const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer storage
const storage = multer.memoryStorage();

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

// Define user routes here
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.post('/reset-password', userController.resetPassword); 
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/toggle-privacy', protect, userController.togglePrivacy);
router.post('/upgrade-premium', protect, userController.upgradeToPremium);
router.post('/profile-picture', protect, upload.single('profilePicture'), userController.updateProfilePicture);
router.post('/highlight-video', protect, upload.single('highlightVideo'), userController.updateHighlightVideo);
//router.post('/courses', protect, userController.addCourse);
//router.post('/achievements', protect, userController.addAchievement);
router.post('/send-verification-email', userController.sendVerificationEmail);
router.post('/verify-email', userController.verifyEmail);
router.post('/check-user-exists', userController.checkUserExists);
//router.delete('/delete-user', userController.deleteUser);
router.delete('/delete-all-users', userController.deleteAllUsers);
router.get('/profilepicture', protect, userController.getProfilePicture);
router.get('/:id/profilepicture', protect, userController.getUserProfilePicture);
router.get('/highlightvideo', protect, userController.getHighlightVideo);
router.get('/:id/highlightvideo', protect, userController.getUserHighlightVideo);
router.get('/total-users', userController.getTotalUsers);
router.get('/total-premium-users', userController.getTotalPremiumUsers);
router.get('/users-growth/three-months', userController.getUsersGrowthThreeMonths);
router.get('/users-growth/year', userController.getUsersGrowthYear);
router.get('/users-growth/lifetime', userController.getUsersGrowthLifetime);
router.get('/search-players', userController.searchPlayers);
router.get('/:userId', protect, userController.getUserById);
router.post('/ban/:userId', protect, userController.banUser);
router.post('/unban/:userId', protect, userController.unbanUser);
router.delete('/:userId', protect, userController.deleteUser);
    
module.exports = router;
