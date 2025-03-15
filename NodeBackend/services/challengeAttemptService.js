const ChallengeAttempt = require('../models/challengeAttemptModel');
const Challenge = require('../models/challengeModel');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Create a new challenge attempt
exports.createAttempt = async (userId, challengeId, videoUrl) => {
  console.log(`[Debug Backend] Starting createAttempt service: userId=${userId}, challengeId=${challengeId}, videoUrl=${videoUrl}`);
  
  // Check if challenge exists and is active
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    console.error(`[Debug Backend] Challenge not found: ${challengeId}`);
    throw new Error('Challenge not found');
  }
  
  console.log(`[Debug Backend] Found challenge: ${challenge.title}, status: ${challenge.status}`);
  
  if (challenge.status !== 'active') {
    console.error(`[Debug Backend] Challenge not active: ${challenge.status}`);
    throw new Error('This challenge is not currently active');
  }
  
  // Check if user has already attempted this challenge
  const existingAttempt = await ChallengeAttempt.findOne({ 
    user: userId, 
    challenge: challengeId 
  });
  
  // If there's an existing attempt, delete it
  if (existingAttempt) {
    console.log(`[Debug Backend] Deleting previous attempt ${existingAttempt._id} for user ${userId} on challenge ${challengeId}`);
    
    // Get the old video path to delete the file later
    const oldVideoUrl = existingAttempt.videoUrl;
    
    // Delete the existing attempt from the database
    await ChallengeAttempt.findByIdAndDelete(existingAttempt._id);
    console.log(`[Debug Backend] Previous attempt deleted from database`);
    
    // Try to delete the old video file if it exists
    if (oldVideoUrl) {
      try {
        // Extract the filename from the URL
        const filename = oldVideoUrl.split('/').pop();
        const filePath = path.join(__dirname, '../../Server/challenges', filename);
        
        console.log(`[Debug Backend] Attempting to delete old video file: ${filePath}`);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[Debug Backend] Deleted old video file: ${filePath}`);
        } else {
          console.log(`[Debug Backend] Old video file not found: ${filePath}`);
        }
      } catch (error) {
        console.error('[Debug Backend] Error deleting old video file:', error);
        // Continue even if file deletion fails
      }
    }
  }
  
  // Create the attempt
  console.log(`[Debug Backend] Creating new attempt`);
  const attempt = new ChallengeAttempt({
    user: userId,
    challenge: challengeId,
    videoUrl,
    upvotes: [],
    downvotes: []
  });
  
  await attempt.save();
  console.log(`[Debug Backend] New attempt saved with ID: ${attempt._id}`);
  
  // Update challenge participants
  if (!challenge.participants.includes(userId)) {
    console.log(`[Debug Backend] Adding user ${userId} to challenge participants`);
    challenge.participants.push(userId);
    challenge.participantCount = challenge.participants.length;
    await challenge.save();
    console.log(`[Debug Backend] Challenge participants updated, new count: ${challenge.participantCount}`);
  }
  
  return attempt;
};

// Get all attempts for a challenge
exports.getAttemptsByChallenge = async (challengeId, sortBy = 'score', sortOrder = -1) => {
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;
  
  return await ChallengeAttempt.find({ challenge: challengeId })
    .populate('user', 'displayName username profilePicture')
    .sort(sortOptions);
};

// Vote on an attempt (up or down)
exports.voteOnAttempt = async (attemptId, userId, voteType) => {
  const attempt = await ChallengeAttempt.findById(attemptId);
  if (!attempt) {
    throw new Error('Attempt not found');
  }
  
  // Check if user is voting on their own attempt
  if (attempt.user.toString() === userId.toString()) {
    throw new Error('You cannot vote on your own attempt');
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Remove any existing votes by this user
    attempt.upvotes = attempt.upvotes.filter(id => id.toString() !== userId.toString());
    attempt.downvotes = attempt.downvotes.filter(id => id.toString() !== userId.toString());
    
    // Add the new vote
    if (voteType === 'up') {
      attempt.upvotes.push(userId);
    } else if (voteType === 'down') {
      attempt.downvotes.push(userId);
    }
    
    // Update score
    attempt.score = attempt.upvotes.length - attempt.downvotes.length;
    
    await attempt.save({ session });
    await session.commitTransaction();
    
    return attempt;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Get a user's attempt for a challenge
exports.getUserAttempt = async (userId, challengeId) => {
  return await ChallengeAttempt.findOne({
    user: userId,
    challenge: challengeId
  }).populate('user', 'displayName username profilePicture');
};

// Get top attempts for a challenge (for determining winners)
exports.getTopAttempts = async (challengeId, limit = 3) => {
  return await ChallengeAttempt.find({ challenge: challengeId })
    .sort({ score: -1 })
    .limit(limit)
    .populate('user', 'displayName username profilePicture email');
};

// Get all attempts
exports.getAllAttempts = async () => {
  return await ChallengeAttempt.find()
    .populate('user', 'displayName username profilePicture')
    .populate('challenge', 'title description')
    .sort({ createdAt: -1 });
};

// Get attempt by ID
exports.getAttemptById = async (attemptId) => {
  return await ChallengeAttempt.findById(attemptId)
    .populate('user', 'displayName username profilePicture')
    .populate('challenge', 'title description');
}; 