const userService = require('../services/userService');

exports.registerUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const result = await userService.registerUser(email, password, displayName);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

exports.logoutUser = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    await userService.resetPassword(email, password);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    await userService.sendVerificationEmail(email);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    await userService.verifyEmail(email, code);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profilePicture = req.files?.profilePicture;
    const user = await userService.updateProfile(req.user.id, req.body, profilePicture);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.togglePrivacy = async (req, res) => {
  try {
    const result = await userService.togglePrivacy(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.upgradeToPremium = async (req, res) => {
  try {
    const result = await userService.upgradeToPremium(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const imageUrl = 'path/to/uploaded/image.jpg';
    const user = await userService.updateProfilePicture(req.user.id, imageUrl);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateHighlightVideo = async (req, res) => {
  try {
    if (!req.files || !req.files.highlightVideo) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const video = req.files.highlightVideo;
    
    // Check file size (100MB = 100 * 1024 * 1024 bytes)
    if (video.size > 100 * 1024 * 1024) {
      return res.status(400).json({ message: 'Video file must be smaller than 100MB' });
    }

    // Check if it's a video file
    if (!video.mimetype.startsWith('video/')) {
      return res.status(400).json({ message: 'File must be a video' });
    }

    const user = await userService.updateHighlightVideo(req.user.id, video);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const user = await userService.addCourse(req.user.id, courseId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addAchievement = async (req, res) => {
  try {
    const { achievementId } = req.body;
    const user = await userService.addAchievement(req.user.id, achievementId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;
    await userService.checkUserExists(email);
    res.json({ message: 'User does not exist' });
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error checking user existence', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    await userService.deleteUser(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
    const deletedCount = await userService.deleteAllUsers();
    res.status(200).json({ 
      message: 'All users deleted successfully', 
      deletedCount: deletedCount 
    });
  } catch (error) {
    console.error('Error in deleteAllUsers controller:', error);
    res.status(500).json({ 
      message: 'Error deleting all users', 
      error: error.message 
    });
  }
};

exports.getProfilePicture = async (req, res) => {
  try {
    const picturePath = await userService.getProfilePicturePath(req.user.id);
    if (!picturePath) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }
    res.sendFile(picturePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addProfilePicture = async (req, res) =>{
  try {
    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ message: 'No profile picture uploaded' });
    }

    const user = await userService.updateProfilePicture(req.user.id, req.files.profilePicture);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getHighlightVideo = async (req, res) => {
  try {
    const videoPath = await userService.getHighlightVideoPath(req.user.id);
    if (!videoPath) {
      return res.status(404).json({ message: 'Highlight video not found' });
    }

    // Set appropriate content type for video
    res.set('Content-Type', 'video/mp4');
    res.sendFile(videoPath);
  } catch (error) {
    console.error('Highlight video error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTotalUsers = async (req, res) => {
  try {
    const count = await userService.getTotalUsers();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTotalPremiumUsers = async (req, res) => {
  try {
    const count = await userService.getTotalPremiumUsers();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTotalRevenue = async (req, res) => {
  try {
    const revenue = await userService.getTotalRevenue();
    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersGrowthThreeMonths = async (req, res) => {
  try {
    const data = await userService.getUsersGrowthThreeMonths();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersGrowthYear = async (req, res) => {
  try {
    const data = await userService.getUsersGrowthYear();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersGrowthLifetime = async (req, res) => {
  try {
    const data = await userService.getUsersGrowthLifetime();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueGrowthThreeMonths = async (req, res) => {
  try {
    const data = await userService.getRevenueGrowthThreeMonths();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueGrowthYear = async (req, res) => {
  try {
    const data = await userService.getRevenueGrowthYear();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueGrowthLifetime = async (req, res) => {
  try {
    const data = await userService.getRevenueGrowthLifetime();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPremiumSubscriptionsThreeMonths = async (req, res) => {
  try {
    const data = await userService.getPremiumSubscriptionsThreeMonths();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPremiumSubscriptionsYear = async (req, res) => {
  try {
    const data = await userService.getPremiumSubscriptionsYear();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPremiumSubscriptionsLifetime = async (req, res) => {
  try {
    const data = await userService.getPremiumSubscriptionsLifetime();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPremiumUnsubscriptionsThreeMonths = async (req, res) => {
  try {
    const data = await userService.getPremiumUnsubscriptionsThreeMonths();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPremiumUnsubscriptionsYear = async (req, res) => {
  try {
    const data = await userService.getPremiumUnsubscriptionsYear();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPremiumUnsubscriptionsLifetime = async (req, res) => {
  try {
    const data = await userService.getPremiumUnsubscriptionsLifetime();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchPlayers = async (req, res) => {
  try {
    const { query } = req.query;
    const players = await userService.searchPlayers(query);
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};