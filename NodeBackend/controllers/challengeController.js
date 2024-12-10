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
