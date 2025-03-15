const challengeAttemptService = require('../services/challengeAttemptService');
const path = require('path');
const fs = require('fs');
const ChallengeAttempt = require('../models/challengeAttemptModel');

// Create a new challenge attempt
exports.createAttempt = async (req, res) => {
  try {
    console.log('[Debug Backend] Starting challenge attempt creation');
    
    // Check if video file was uploaded
    if (!req.file) {
      console.error('[Debug Backend] No video file uploaded');
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    console.log('[Debug Backend] Video file received:', req.file.filename, 'Size:', req.file.size);
    
    // Check if user already has an attempt for this challenge
    const existingAttempt = await ChallengeAttempt.findOne({
      user: req.user._id,
      challenge: req.params.challengeId
    });
    
    const isReplacement = !!existingAttempt;
    console.log('[Debug Backend] Is replacing existing attempt:', isReplacement);
    
    // Get video file path
    const filename = req.file.filename;
    const videoUrl = `/challenges/${filename}`;
    console.log('[Debug Backend] Video URL:', videoUrl);
    
    try {
      // Create attempt (will replace existing if present)
      console.log('[Debug Backend] Creating attempt for user:', req.user._id, 'challenge:', req.params.challengeId);
      const attempt = await challengeAttemptService.createAttempt(
        req.user._id,
        req.params.challengeId,
        videoUrl
      );
      
      console.log('[Debug Backend] Challenge attempt created successfully');
      res.status(201).json({
        ...attempt.toObject(),
        isReplacement
      });
    } catch (serviceError) {
      console.error('[Debug Backend] Error in challenge attempt service:', serviceError);
      
      // If there was an error creating the attempt but the file was uploaded,
      // we should delete the file to avoid orphaned files
      try {
        const filePath = path.join(__dirname, '../../Server/challenges', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[Debug Backend] Cleaned up file after failed attempt creation:', filePath);
        }
      } catch (cleanupError) {
        console.error('[Debug Backend] Error cleaning up file:', cleanupError);
      }
      
      throw serviceError;
    }
  } catch (error) {
    console.error('[Debug Backend] Error creating challenge attempt:', error);
    res.status(400).json({ message: error.message || 'Failed to create challenge attempt' });
  }
};

// Get all attempts for a challenge
exports.getAttemptsByChallenge = async (req, res) => {
  try {
    const { sortBy, order } = req.query;
    const sortOrder = order === 'asc' ? 1 : -1;
    
    console.log('[Debug Backend] Getting attempts for challenge ID:', req.params.challengeId);
    console.log('[Debug Backend] User auth:', req.user ? `Authenticated as ${req.user._id}` : 'Not authenticated');
    console.log('[Debug Backend] Query params:', { sortBy, order, sortOrder });
    
    const attempts = await challengeAttemptService.getAttemptsByChallenge(
      req.params.challengeId,
      sortBy || 'score',
      sortOrder
    );
    
    console.log(`[Debug Backend] Retrieved ${attempts.length} attempts`);
    res.json(attempts);
  } catch (error) {
    console.error('[Debug Backend] Error getting challenge attempts:', error);
    res.status(400).json({ message: error.message });
  }
};

// Vote on an attempt
exports.voteOnAttempt = async (req, res) => {
  try {
    const { voteType } = req.body;
    
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    
    const attempt = await challengeAttemptService.voteOnAttempt(
      req.params.attemptId,
      req.user._id,
      voteType
    );
    
    res.json(attempt);
  } catch (error) {
    console.error('Error voting on attempt:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get a user's attempt for a challenge
exports.getUserAttempt = async (req, res) => {
  try {
    console.log('[Debug Backend] Getting user attempt for challenge ID:', req.params.challengeId);
    console.log('[Debug Backend] User auth:', req.user ? `Authenticated as ${req.user._id}` : 'Not authenticated');
    
    const attempt = await challengeAttemptService.getUserAttempt(
      req.user._id,
      req.params.challengeId
    );
    
    if (!attempt) {
      console.log('[Debug Backend] No attempt found for this user and challenge');
      return res.status(404).json({ message: 'No attempt found' });
    }
    
    console.log('[Debug Backend] Found user attempt:', attempt._id);
    res.json(attempt);
  } catch (error) {
    console.error('[Debug Backend] Error getting user attempt:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all attempts
exports.getAllAttempts = async (req, res) => {
  try {
    const attempts = await challengeAttemptService.getAllAttempts();
    res.json(attempts);
  } catch (error) {
    console.error('Error getting all attempts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attempt by ID
exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await challengeAttemptService.getAttemptById(req.params.id);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    res.json(attempt);
  } catch (error) {
    console.error('Error getting attempt by ID:', error);
    res.status(500).json({ message: error.message });
  }
}; 