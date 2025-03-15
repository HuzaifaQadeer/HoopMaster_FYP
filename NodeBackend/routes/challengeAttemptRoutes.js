const express = require('express');
const router = express.Router();
const challengeAttemptController = require('../controllers/challengeAttemptController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Debug: Check if controller functions are properly exported
console.log('Controller functions:', Object.keys(challengeAttemptController));
console.log('createAttempt function:', typeof challengeAttemptController.createAttempt);
console.log('getAttemptsByChallenge function:', typeof challengeAttemptController.getAttemptsByChallenge);
console.log('getUserAttempt function:', typeof challengeAttemptController.getUserAttempt);
console.log('voteOnAttempt function:', typeof challengeAttemptController.voteOnAttempt);
console.log('getAllAttempts function:', typeof challengeAttemptController.getAllAttempts);
console.log('getAttemptById function:', typeof challengeAttemptController.getAttemptById);

// Basic route for testing
router.get('/', (req, res) => {
  res.json({ message: 'Challenge attempts API' });
});

// Set up multer storage for challenge videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/challenges');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `challenge-${req.params.challengeId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Add routes one by one
router.get('/challenge/:challengeId', protect, (req, res) => {
  challengeAttemptController.getAttemptsByChallenge(req, res);
});

router.get('/user/:challengeId', protect, (req, res) => {
  challengeAttemptController.getUserAttempt(req, res);
});

router.get('/all', protect, (req, res) => {
  challengeAttemptController.getAllAttempts(req, res);
});

router.get('/attempt/:id', protect, (req, res) => {
  challengeAttemptController.getAttemptById(req, res);
});

router.post('/:challengeId', protect, upload.single('video'), (req, res) => {
  challengeAttemptController.createAttempt(req, res);
});

router.post('/vote/:attemptId', protect, (req, res) => {
  challengeAttemptController.voteOnAttempt(req, res);
});

module.exports = router; 