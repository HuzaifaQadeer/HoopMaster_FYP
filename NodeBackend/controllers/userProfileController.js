const User = require('../models/userModel');
const Post = require('../models/postModel');
const Report = require('../models/reportModel');
const Challenge = require('../models/challengeModel');
const ChallengeAttempt = require('../models/challengeAttemptModel');
const Achievement = require('../models/achievementModel');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user stats
    const postsCount = await Post.countDocuments({ 
      user: userId, 
      isDeleted: false 
    });
    
    const attemptCount = await ChallengeAttempt.countDocuments({
      user: userId,
      status: { $ne: 'rejected' }
    });
    
    const achievementCount = await Achievement.countDocuments({
      user: userId
    });
    
    // Check if requesting user has admin privileges
    const isAdmin = req.user && req.user.isAdmin;
    
    // Format user data with all necessary fields
    const userProfile = {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: isAdmin ? user.email : undefined, // Only expose email to admins
      bio: user.bio,
      profilePicture: user.profilePicture,
      highlightVideo: user.highlightVideo,
      socialMedia: user.socialMedia,
      height: user.height,
      weight: user.weight,
      wingspan: user.wingspan,
      verticalJump: user.verticalJump,
      position: user.position,
      aboutMe: user.aboutMe,
      isPremium: user.isPremium,
      isPrivate: user.isPrivate,
      isAdmin: user.isAdmin,
      isBanned: user.isBanned,
      banReason: isAdmin ? user.banReason : undefined, // Only expose ban reason to admins
      banExpires: user.isBanned ? user.banExpires : undefined,
      createdAt: user.createdAt,
      stats: {
        postsCount,
        attemptCount,
        achievementCount
      }
    };
    
    console.log('Sending user profile:', JSON.stringify(userProfile, null, 2));
    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
};

// Check user ban status
exports.checkBanStatus = async (req, res) => {
  try {
    // Use the current user's ID if no ID is provided
    const userId = req.params.id || req.user._id;
    
    const user = await User.findById(userId).select('isBanned banReason banExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If the user is banned but the ban has expired, unban them
    if (user.isBanned && user.banExpires && new Date() > user.banExpires) {
      user.isBanned = false;
      user.banReason = '';
      user.banExpires = null;
      await user.save();
      
      return res.status(200).json({
        isBanned: false,
        message: 'Your previous ban has expired'
      });
    }
    
    res.status(200).json({
      isBanned: user.isBanned,
      banReason: user.isBanned ? user.banReason : undefined,
      banExpires: user.isBanned ? user.banExpires : undefined
    });
  } catch (error) {
    console.error('Error checking ban status:', error);
    res.status(500).json({ message: 'Error checking ban status' });
  }
};

// Ban user (admin only)
exports.banUser = async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const { reason, duration } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason for ban is required' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Admin cannot ban another admin
    if (user.isAdmin) {
      return res.status(403).json({ message: 'Cannot ban an admin user' });
    }
    
    // Set ban expiration if duration is provided (in days)
    let banExpires = null;
    if (duration && !isNaN(duration)) {
      banExpires = new Date();
      banExpires.setDate(banExpires.getDate() + parseInt(duration));
    }
    
    // Ban the user
    user.isBanned = true;
    user.banReason = reason;
    user.banExpires = banExpires;
    
    await user.save();
    
    res.status(200).json({
      message: 'User banned successfully',
      user: {
        _id: user._id,
        username: user.username,
        isBanned: user.isBanned,
        banReason: user.banReason,
        banExpires: user.banExpires
      }
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Error banning user' });
  }
};

// Unban user (admin only)
exports.unbanUser = async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Unban the user
    user.isBanned = false;
    user.banReason = '';
    user.banExpires = null;
    
    await user.save();
    
    res.status(200).json({
      message: 'User unbanned successfully',
      user: {
        _id: user._id,
        username: user.username,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'Error unbanning user' });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Base query
    const query = { 
      user: userId, 
      isDeleted: false 
    };
    
    // If not the profile owner or admin, only show public posts
    if (req.user._id.toString() !== userId.toString() && !req.user.isAdmin) {
      query.isPrivate = false;
    }
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'displayName username profilePicture');
    
    // Get total count for pagination
    const total = await Post.countDocuments(query);
    
    res.status(200).json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ message: 'Error retrieving user posts' });
  }
};

// Get user's achievements
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const achievements = await Achievement.find({ user: userId })
      .sort({ awardedAt: -1 })
      .populate('challenge', 'title description');
    
    res.status(200).json(achievements);
  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(500).json({ message: 'Error retrieving user achievements' });
  }
};

// Get user's challenge attempts
exports.getUserChallengeAttempts = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const attempts = await ChallengeAttempt.find({ 
      user: userId,
      status: { $ne: 'rejected' }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('challenge', 'title description')
      .populate('user', 'displayName username profilePicture');
    
    // Get total count for pagination
    const total = await ChallengeAttempt.countDocuments({ 
      user: userId,
      status: { $ne: 'rejected' }
    });
    
    res.status(200).json({
      attempts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user challenge attempts:', error);
    res.status(500).json({ message: 'Error retrieving user challenge attempts' });
  }
}; 