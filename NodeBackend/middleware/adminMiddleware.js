const User = require('../models/User');

/**
 * Middleware to protect admin-only routes
 * This should be used after the auth protection middleware
 */
const adminProtect = async (req, res, next) => {
  try {
    // Check if user exists and is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, please log in' });
    }
    
    // Fetch the user to check their role
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is an admin
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // User is an admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error in admin authorization' });
  }
};

module.exports = { adminProtect }; 