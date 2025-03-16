const User = require('../models/userModel');

/**
 * Middleware to check if a user is banned before allowing access to routes
 */
const checkBan = async (req, res, next) => {
  try {
    // Skip ban check for admins
    if (req.user.isAdmin) {
      return next();
    }
    
    const user = await User.findById(req.user._id).select('banStatus');
    
    // If user not found (shouldn't happen since we already passed auth)
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // If the user is banned but the ban has expired, unban them
    if (user.banStatus.isBanned && user.banStatus.bannedUntil && new Date() > user.banStatus.bannedUntil) {
      user.banStatus = {
        isBanned: false,
        banReason: '',
        banDuration: 0,
        bannedAt: null,
        bannedUntil: null,
        bannedBy: null,
        banHistory: user.banStatus.banHistory // Preserve ban history
      };
      await user.save();
      
      // Allow the user to proceed
      return next();
    }
    
    // If user is banned, deny access
    if (user.banStatus.isBanned) {
      // Format ban expiration (if temporary ban)
      let expiration = user.banStatus.bannedUntil 
        ? `until ${user.banStatus.bannedUntil.toLocaleDateString()}` 
        : 'permanently';
      
      return res.status(403).json({ 
        message: `Your account has been banned ${expiration}`,
        reason: user.banStatus.banReason || 'No reason provided',
        banExpires: user.banStatus.bannedUntil || null,
        isBanned: true
      });
    }
    
    // User not banned, proceed
    next();
  } catch (error) {
    console.error('Error checking ban status:', error);
    res.status(500).json({ message: 'Error checking ban status' });
  }
};

module.exports = { checkBan };