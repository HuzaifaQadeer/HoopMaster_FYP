const express = require('express');
const router = express.Router();
const challengeAttemptController = require('../controllers/challengeAttemptController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Create a new challenge attempt
router.post('/:challengeId', 
  authMiddleware, 
  upload.single('video'), 
  challengeAttemptController.createAttempt
);

// Get all attempts for a challenge
router.get('/challenge/:challengeId', 
  challengeAttemptController.getAttemptsByChallenge
);

// Get a user's attempt for a challenge
router.get('/user/:challengeId', 
  authMiddleware, 
  challengeAttemptController.getUserAttempt
);

// Vote on an attempt
router.post('/vote/:attemptId', 
  authMiddleware, 
  challengeAttemptController.voteOnAttempt
);

module.exports = router; 