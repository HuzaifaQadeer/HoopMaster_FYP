const challengeAttemptService = require('../services/challengeAttemptService');
const path = require('path');
const fs = require('fs');

// Create a new challenge attempt
exports.createAttempt = async (req, res) => {
  try {
    // Check if video file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    // Get video file path
    const videoUrl = `/uploads/challenges/${req.file.filename}`;
    
    // Create attempt
    const attempt = await challengeAttemptService.createAttempt(
      req.user._id,
      req.params.challengeId,
      videoUrl
    );
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error creating challenge attempt:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all attempts for a challenge
exports.getAttemptsByChallenge = async (req, res) => {
  try {
    const { sortBy, order } = req.query;
    const sortOrder = order === 'asc' ? 1 : -1;
    
    const attempts = await challengeAttemptService.getAttemptsByChallenge(
      req.params.challengeId,
      sortBy || 'score',
      sortOrder
    );
    
    res.json(attempts);
  } catch (error) {
    console.error('Error getting challenge attempts:', error);
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
    const attempt = await challengeAttemptService.getUserAttempt(
      req.user._id,
      req.params.challengeId
    );
    
    if (!attempt) {
      return res.status(404).json({ message: 'No attempt found' });
    }
    
    res.json(attempt);
  } catch (error) {
    console.error('Error getting user attempt:', error);
    res.status(400).json({ message: error.message });
  }
}; 