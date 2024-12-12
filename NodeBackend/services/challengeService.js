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
