const challengeService = require('../services/challengeService');

exports.createChallenge = async (req, res) => {
  try {
    const challenge = await challengeService.createChallenge(req.body);
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllChallenges = async (req, res) => {
  try {
    const challenges = await challengeService.getAllChallenges();
    res.json(challenges);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteChallenge = async (req, res) => {
  try {
    await challengeService.deleteChallenge(req.params.id);
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTopPopularChallenges = async (req, res) => {
  try {
    const challenges = await challengeService.getTopPopularChallenges();
    res.json(challenges);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// New controllers for community features

// Get active challenges for the community page
exports.getActiveChallenges = async (req, res) => {
  try {
    const challenges = await challengeService.getActiveChallenges();
    res.json(challenges);
  } catch (error) {
    console.error('Error getting active challenges:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get a challenge by ID with all details
exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await challengeService.getChallengeById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    console.error('Error getting challenge by ID:', error);
    res.status(400).json({ message: error.message });
  }
};

// Check for expired challenges and update their status
exports.checkExpiredChallenges = async (req, res) => {
  try {
    const expiredChallengeIds = await challengeService.checkExpiredChallenges();
    res.json({ 
      message: `${expiredChallengeIds.length} challenges marked as completed`,
      expiredChallengeIds 
    });
  } catch (error) {
    console.error('Error checking expired challenges:', error);
    res.status(400).json({ message: error.message });
  }
};
