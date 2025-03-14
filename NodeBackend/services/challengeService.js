const Challenge = require('../models/challengeModel');

exports.createChallenge = async (challengeData) => {
  const challenge = new Challenge(challengeData);
  await challenge.save();
  return challenge;
};

exports.getAllChallenges = async () => {
  return await Challenge.find()
    .populate('participants', 'displayName profilePicture')
    .populate('topScores.user', 'displayName profilePicture')
    .sort('-createdAt');
};

exports.deleteChallenge = async (challengeId) => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  await Challenge.findByIdAndDelete(challengeId);
};

exports.getTopPopularChallenges = async () => {
  return await Challenge.find()
    .sort('-participants')
    .limit(4)
    .populate('participants', 'displayName profilePicture');
};

// Get active challenges (for the community page)
exports.getActiveChallenges = async () => {
  const now = new Date();
  return await Challenge.find({
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true
  })
  .populate('participants', 'displayName profilePicture')
  .populate('topScores.user', 'displayName profilePicture')
  .sort('endDate');  // Sort by closest to deadline
};

// Get a single challenge by ID with participant details
exports.getChallengeById = async (challengeId) => {
  return await Challenge.findById(challengeId)
    .populate('participants', 'displayName username profilePicture')
    .populate('topScores.user', 'displayName username profilePicture')
    .populate('createdBy', 'displayName username');
};

// Update top scores for a challenge
exports.updateTopScores = async (challengeId, topScores) => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  challenge.topScores = topScores;
  await challenge.save();
  return challenge;
};

// Check for expired challenges and update their status
exports.checkExpiredChallenges = async () => {
  const now = new Date();
  console.log(`Checking for challenges that have ended before ${now.toISOString()}`);
  
  const expiredChallenges = await Challenge.find({
    endDate: { $lt: now },
    status: 'active'
  });
  
  console.log(`Found ${expiredChallenges.length} expired challenges`);
  
  const updates = [];
  
  for (const challenge of expiredChallenges) {
    console.log(`Marking challenge ${challenge._id} (${challenge.title}) as completed`);
    challenge.status = 'completed';
    await challenge.save();
    updates.push(challenge._id);
  }
  
  return updates;
};
