const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', adminController.loginAdmin);
router.post('/create', adminController.createAdmin);
router.post('/logout', authMiddleware, adminController.logoutAdmin);
router.post('/change-password', authMiddleware, adminController.changePassword);

module.exports = router;
