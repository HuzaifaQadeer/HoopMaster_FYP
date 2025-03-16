const userService = require('../services/userService');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/userModel');

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
    const { userId } = req.params;
    
    // Add admin check if needed
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Access denied: Admin only' });
    // }
    
    const result = await userService.deleteUser(userId);
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    if (error.message === 'User not found') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
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

exports.searchPlayers = async (req, res) => {
  try {
    const { query } = req.query;
    const players = await userService.searchPlayers(query);
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getProfile(userId);
    
    // Optional: Check if requesting user is an admin
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Access denied: Admin only' });
    // }
    
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await userService.searchUsers(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration, reason } = req.body;
    
    if (!duration || !reason) {
      return res.status(400).json({ 
        message: 'Ban duration and reason are required' 
      });
    }

    const banData = {
      duration: parseInt(duration),
      reason: reason
    };

    const user = await userService.banUser(userId, banData, req.user.id);
    
    res.status(200).json({
      message: 'User banned successfully',
      banStatus: user.banStatus
    });
  } catch (error) {
    console.error('Ban error:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to ban user' 
    });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.unbanUser(userId, req.user.id);
    res.json({
      message: 'User unbanned successfully',
      banStatus: user.banStatus
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkBanStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const banStatus = await userService.checkBanStatus(userId);
    res.json(banStatus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserProfilePicture = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // If user ID is invalid, return 400 error
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.profilePicture) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }
    
    const picturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', user.profilePicture);
    
    try {
      await fs.access(picturePath);
      res.sendFile(picturePath);
    } catch (error) {
      console.error('Error accessing profile picture:', error);
      return res.status(404).json({ message: 'Profile picture file not found' });
    }
  } catch (error) {
    console.error('Error in getUserProfilePicture:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserHighlightVideo = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // If user ID is invalid, return 400 error
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.highlightVideo) {
      return res.status(404).json({ message: 'Highlight video not found' });
    }
    
    const videoPath = path.join(__dirname, '..', '..', 'Server', 'highlights', user.highlightVideo);
    
    try {
      await fs.access(videoPath);
      // Set appropriate content type for video
      res.set('Content-Type', 'video/mp4');
      res.sendFile(videoPath);
    } catch (error) {
      console.error('Error accessing highlight video:', error);
      return res.status(404).json({ message: 'Highlight video file not found' });
    }
  } catch (error) {
    console.error('Error in getUserHighlightVideo:', error);
    res.status(500).json({ message: error.message });
  }
};