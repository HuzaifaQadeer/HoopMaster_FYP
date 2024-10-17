const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Define user routes here
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.post('/reset-password', userController.resetPassword);
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/toggle-privacy', authMiddleware, userController.togglePrivacy);
router.post('/upgrade-premium', authMiddleware, userController.upgradeToPremium);
//router.put('/profile-picture', authMiddleware, userController.updateProfilePicture);
//router.put('/highlight-video', authMiddleware, userController.updateHighlightVideo);
//router.post('/courses', authMiddleware, userController.addCourse);
//router.post('/achievements', authMiddleware, userController.addAchievement);
router.post('/send-verification-email', userController.sendVerificationEmail);
router.post('/verify-email', userController.verifyEmail);
router.post('/check-user-exists', userController.checkUserExists);
router.delete('/delete-user', userController.deleteUser);
router.delete('/delete-all-users', userController.deleteAllUsers);


module.exports = router;
