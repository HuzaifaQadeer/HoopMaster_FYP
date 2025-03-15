const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Admin authentication routes
router.post('/login', adminController.loginAdmin);
router.post('/register', adminController.createAdmin);
router.post('/logout', protect, adminController.logoutAdmin);
router.post('/change-password', protect, adminController.changePassword);

module.exports = router;
