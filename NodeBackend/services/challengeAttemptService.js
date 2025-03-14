const ChallengeAttempt = require('../models/challengeAttemptModel');
const Challenge = require('../models/challengeModel');
const mongoose = require('mongoose');

// Create a new challenge attempt
exports.createAttempt = async (userId, challengeId, videoUrl) => {
  // Check if challenge exists and is active
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  if (challenge.status !== 'active') {
    throw new Error('This challenge is not currently active');
  }
  
  // Check if user has already attempted this challenge
  const existingAttempt = await ChallengeAttempt.findOne({ 
    user: userId, 
    challenge: challengeId 
  });
  
  if (existingAttempt) {
    throw new Error('You have already attempted this challenge');
  }
  
  // Create the attempt
  const attempt = new ChallengeAttempt({
    user: userId,
    challenge: challengeId,
    videoUrl,
    upvotes: [],
    downvotes: []
  });
  
  await attempt.save();
  
  // Update challenge participants
  if (!challenge.participants.includes(userId)) {
    challenge.participants.push(userId);
    challenge.participantCount = challenge.participants.length;
    await challenge.save();
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