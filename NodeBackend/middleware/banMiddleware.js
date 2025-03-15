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
    
    const user = await User.findById(req.user._id).select('isBanned banReason banExpires');
    
    // If user not found (shouldn't happen since we already passed auth)
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // If the user is banned but the ban has expired, unban them
    if (user.isBanned && user.banExpires && new Date() > user.banExpires) {
      user.isBanned = false;
      user.banReason = '';
      user.banExpires = null;
      await user.save();
      
      // Allow the user to proceed
      return next();
    }
    
    // If user is banned, deny access
    if (user.isBanned) {
      // Format ban expiration (if temporary ban)
      let expiration = user.banExpires 
        ? `until ${user.banExpires.toLocaleDateString()}` 
        : 'permanently';
      
      return res.status(403).json({ 
        message: `Your account has been banned ${expiration}`,
        reason: user.banReason || 'No reason provided',
        banExpires: user.banExpires || null,
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