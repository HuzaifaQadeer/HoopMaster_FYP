const User = require('../models/userModel');
const VerificationCode = require('../models/verficationcodeModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs').promises;
const Revenue = require('../models/revenueModel');

class UserService {
  async registerUser(email, password, displayName) {
    if (await User.findOne({ email })) {
      throw new Error('User already exists');
    }

    if (await User.findOne({ displayName })) {
      throw new Error('Username already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashedPassword,
      displayName,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return { token, user: { id: user._id, email: user.email, displayName: user.displayName } };
  }

  async loginUser(email, password) {
    try {
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

      // Ensure all fields are properly formatted
      const response = {
        token: token,
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName || null
        }
      };

      // Validate the response format
      if (!response.token || !response.user || !response.user.id) {
        throw new Error('Error creating login response');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Password does not meet requirements');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();
  }

  async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, updates, profilePicture = null) {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    console.log('Received updates:', updates);

    // Create a clean updates object
    const cleanUpdates = { ...updates };

    // Remove sensitive and system fields
    const excludedFields = [
      'courses',
      'drills',
      'achievements',
      'posts',
      'comments',
      'banStatus',
      'password',
      'createdAt',
      'updatedAt',
      '__v'
    ];
    
    excludedFields.forEach(field => {
      delete cleanUpdates[field];
    });

    // Parse JSON strings back to objects
    ['socialMedia', 'height', 'weight', 'wingspan', 'verticalJump'].forEach(field => {
      if (cleanUpdates[field] && typeof cleanUpdates[field] === 'string') {
        try {
          cleanUpdates[field] = JSON.parse(cleanUpdates[field]);
        } catch (error) {
          console.error(`Error parsing ${field}:`, error);
          cleanUpdates[field] = currentUser[field];
        }
      }
    });

    if (profilePicture) {
      if (currentUser.profilePicture) {
        const oldPicturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', currentUser.profilePicture);
        await fs.unlink(oldPicturePath).catch(err => console.error('Error deleting old profile picture:', err));
      }

      const fileExtension = path.extname(profilePicture.name);
      const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
      const uploadPath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', uniqueFilename);

      await profilePicture.mv(uploadPath);
      cleanUpdates.profilePicture = uniqueFilename;
    }

    // Safely parse JSON fields
    ['socialMedia', 'height', 'weight', 'wingspan', 'verticalJump'].forEach(field => {
      if (cleanUpdates[field]) {
        console.log(`Processing ${field}:`, {
          value: cleanUpdates[field],
          type: typeof cleanUpdates[field]
        });

        try {
          // If it's a string and looks like JSON, try to parse it
          if (typeof cleanUpdates[field] === 'string' && 
              (cleanUpdates[field].startsWith('{') || cleanUpdates[field].startsWith('['))) {
            cleanUpdates[field] = JSON.parse(cleanUpdates[field]);
            console.log(`Successfully parsed ${field}:`, cleanUpdates[field]);
          } else if (typeof cleanUpdates[field] === 'object') {
            console.log(`${field} is already an object:`, cleanUpdates[field]);
          } else {
            console.log(`${field} is neither JSON string nor object:`, cleanUpdates[field]);
            // For non-JSON string values, create a default measurement object
            if (['height', 'weight', 'wingspan', 'verticalJump'].includes(field)) {
              cleanUpdates[field] = {
                value: cleanUpdates[field],
                unit: field === 'weight' ? 'kg' : 'cm'
              };
            }
          }
        } catch (error) {
          console.error(`Error processing ${field}:`, error);
          // If parsing fails, keep the original value
          cleanUpdates[field] = currentUser[field];
        }
      }
    });

    // Convert measurements with validation
    ['height', 'weight', 'wingspan', 'verticalJump'].forEach(field => {
      if (cleanUpdates[field]) {
        console.log(`Converting measurement for ${field}:`, cleanUpdates[field]);
        try {
          if (typeof cleanUpdates[field] === 'object' && cleanUpdates[field].value !== undefined) {
            cleanUpdates[field] = this.convertMeasurement(cleanUpdates[field], field);
            console.log(`Converted ${field}:`, cleanUpdates[field]);
          } else {
            console.log(`Invalid measurement format for ${field}`);
          }
        } catch (error) {
          console.error(`Error converting ${field}:`, error);
          // If conversion fails, keep the original value
          cleanUpdates[field] = currentUser[field];
        }
      }
    });

    console.log('Final cleanUpdates:', cleanUpdates);

    // Update user with clean updates
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: cleanUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  convertMeasurement(measurement, field) {
    // If measurement is null or undefined, return default
    if (!measurement) {
      return { value: null, unit: field === 'weight' ? 'kg' : 'cm' };
    }

    // Ensure measurement is an object
    if (typeof measurement !== 'object') {
      console.log(`Invalid measurement format for ${field}:`, measurement);
      return { value: null, unit: field === 'weight' ? 'kg' : 'cm' };
    }

    // Create a safe copy
    const result = { 
      value: null,
      unit: measurement.unit || (field === 'weight' ? 'kg' : 'cm')
    };

    // Handle the value
    if (measurement.value !== undefined) {
      // If value is a string, try to convert it to a number
      if (typeof measurement.value === 'string') {
        // Remove any non-numeric characters except decimal point
        const cleanValue = measurement.value.replace(/[^\d.-]/g, '');
        
        // Try to parse as float
        const numValue = parseFloat(cleanValue);
        
        // Check if it's a valid number
        if (!isNaN(numValue)) {
          result.value = numValue;
        } else {
          result.value = null;
        }
      } else if (typeof measurement.value === 'number') {
        result.value = measurement.value;
      }
    }

    // Handle unit conversions
    const conversionMap = {
      height: { from: 'ft', to: 'cm', factor: 30.48 },
      weight: { from: 'lbs', to: 'kg', factor: 0.453592 },
      wingspan: { from: 'in', to: 'cm', factor: 2.54 },
      verticalJump: { from: 'in', to: 'cm', factor: 2.54 }
    };

    const conversion = conversionMap[field];
    if (conversion && result.unit === conversion.from && result.value !== null) {
      result.value = result.value * conversion.factor;
      result.unit = conversion.to;
    }

    return result;
  }

  async togglePrivacy(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.isPrivate = !user.isPrivate;
    await user.save();
    return { isPrivate: user.isPrivate };
  }

  async upgradeToPremium(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.isPremium = true;
    user.premiumStartDate = new Date();
    // Set expiry date to 30 days from now
    user.premiumExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await user.save();

    // Create revenue record
    await Revenue.create({
      userId: user._id,
      amount: 9.99, // Or whatever your premium amount is
      source: 'premium_subscribed'
    });

    return { isPremium: user.isPremium };
  }

  async updateProfilePicture(userId, profilePicture) {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Delete old profile picture if it exists
    if (currentUser.profilePicture) {
      const oldPicturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', currentUser.profilePicture);
      await fs.unlink(oldPicturePath).catch(err => console.error('Error deleting old profile picture:', err));
    }

    // Generate unique filename and save new picture
    const fileExtension = path.extname(profilePicture.name);
    const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const uploadPath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', uniqueFilename);

    await profilePicture.mv(uploadPath);

    // Update database with new filename
    const user = await User.findByIdAndUpdate(
      userId, 
      { profilePicture: uniqueFilename }, 
      { new: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateHighlightVideo(userId, videoFile) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete old video if exists
    if (user.highlightVideo) {
      const oldVideoPath = path.join(__dirname, '..', '..', 'Server', 'highlights', user.highlightVideo);
      await fs.unlink(oldVideoPath).catch(err => console.error('Error deleting old highlight video:', err));
    }

    // Generate unique filename and save new video
    const fileExtension = path.extname(videoFile.name);
    const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const uploadPath = path.join(__dirname, '..', '..', 'Server', 'highlights', uniqueFilename);

    await videoFile.mv(uploadPath);

    // Update database
    user.highlightVideo = uniqueFilename;
    await user.save();

    return user;
  }

  async addCourse(userId, courseId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { courses: courseId } },
      { new: true }
    ).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async addAchievement(userId, achievementId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { achievements: achievementId } },
      { new: true }
    ).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async sendVerificationEmail(email) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await VerificationCode.deleteOne({ userEmail: email });

    await VerificationCode.create({
      userEmail: email,
      code: verificationCode
    });

    setTimeout(async () => {
      await VerificationCode.deleteOne({ userEmail: email, code: verificationCode });
    }, 10 * 60 * 1000);

    await sendEmail({
      email: email,
      subject: 'Email Verification',
      message: `Your email verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`
    });
  }

  async checkUserExists(email) {
    const user = await User.findOne({ email });
    if (user) {
      throw new Error('User already exists');
    }
  }

  async verifyEmail(email, code) {
    const verificationEntry = await VerificationCode.findOne({ userEmail: email, code: code });

    if (!verificationEntry) {
      throw new Error('Invalid or expired verification code');
    }

    await VerificationCode.deleteOne({ _id: verificationEntry._id });
    await User.updateOne({ email }, { $set: { isEmailVerified: true } });
  }

  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete associated files
    if (user.profilePicture) {
      const profilePicturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', user.profilePicture);
      await fs.unlink(profilePicturePath).catch(err => console.error('Error deleting profile picture:', err));
    }

    if (user.highlightVideo) {
      const highlightVideoPath = path.join(__dirname, '..', '..', 'Server', 'highlights', user.highlightVideo);
      await fs.unlink(highlightVideoPath).catch(err => console.error('Error deleting highlight video:', err));
    }

    // Delete user from database
    const result = await User.findByIdAndDelete(userId);
    
    if (!result) {
      throw new Error('User not found');
    }

    return result;
  }

  async deleteAllUsers() {
    const result = await User.deleteMany({});

    const profilePicturesDir = path.join(__dirname, '..', '..', 'Server', 'profilePictures');
    const highlightsDir = path.join(__dirname, '..', '..', 'Server', 'highlights');

    await fs.readdir(profilePicturesDir)
      .then(files => Promise.all(files.map(file => fs.unlink(path.join(profilePicturesDir, file)))))
      .catch(err => console.error('Error deleting profile pictures:', err));

    await fs.readdir(highlightsDir)
      .then(files => Promise.all(files.map(file => fs.unlink(path.join(highlightsDir, file)))))
      .catch(err => console.error('Error deleting highlight videos:', err));

    return result.deletedCount;
  }

  async getProfilePicturePath(userId) {
    const user = await User.findById(userId);
    if (!user || !user.profilePicture) {
      return null;
    }

    const picturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', user.profilePicture);
    
    try {
      await fs.access(picturePath);
      return picturePath;
    } catch (error) {
      console.error('Error accessing profile picture:', error);
      return null;
    }
  }

  async getHighlightVideoPath(userId) {
    const user = await User.findById(userId);
    if (!user || !user.highlightVideo) {
      return null;
    }

    const videoPath = path.join(__dirname, '..', '..', 'Server', 'highlights', user.highlightVideo);
    
    try {
      await fs.access(videoPath);
      return videoPath;
    } catch (error) {
      console.error('Error accessing highlight video:', error);
      return null;
    }
  }

  async getTotalUsers() {
    return await User.countDocuments();
  }

  async getTotalPremiumUsers() {
    return await User.countDocuments({ isPremium: true });
  }

  async getUsersGrowthThreeMonths() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const users = await User.find({ 
      createdAt: { $gte: threeMonthsAgo } 
    });

    // Group users by month
    const monthlyData = users.reduce((acc, user) => {
      const monthName = user.createdAt.toLocaleString('default', { month: 'long' });
      if (!acc[monthName]) {
        acc[monthName] = 0;
      }
      acc[monthName]++;
      return acc;
    }, {});

    // Convert to array format
    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      users: count
    }));
  }

  async getUsersGrowthYear() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const users = await User.find({ 
      createdAt: { $gte: oneYearAgo } 
    });

    // Group users by month
    const monthlyData = users.reduce((acc, user) => {
      const monthName = user.createdAt.toLocaleString('default', { month: 'long' });
      if (!acc[monthName]) {
        acc[monthName] = 0;
      }
      acc[monthName]++;
      return acc;
    }, {});

    // Convert to array format
    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      users: count
    }));
  }

  async getUsersGrowthLifetime() {
    const users = await User.find();

    // Group users by month
    const monthlyData = users.reduce((acc, user) => {
      const monthName = user.createdAt.toLocaleString('default', { month: 'long' });
      if (!acc[monthName]) {
        acc[monthName] = 0;
      }
      acc[monthName]++;
      return acc;
    }, {});

    // Convert to array format
    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      users: count
    }));
  }

  async searchPlayers(query) {
    if (!query) {
      return [];
    }
    
    return await User.find({
      displayName: { $regex: query, $options: 'i' }
    }).select('-password').limit(10);
  }

  async getAllUsers() {
    return await User.find().select('-password');
  }

  async searchUsers(query) {
    return await User.find({
      $or: [
        { displayName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');
  }

  async banUser(userId, banData, adminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const bannedAt = new Date();
    const bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + banData.duration);

    // Create ban record
    const banRecord = {
      reason: banData.reason,
      duration: banData.duration,
      bannedAt: bannedAt,
      bannedUntil: bannedUntil,
      bannedBy: adminId
    };

    // Update current ban status
    user.banStatus = {
      isBanned: true,
      banReason: banData.reason,
      banDuration: banData.duration,
      bannedAt: bannedAt,
      bannedUntil: bannedUntil,
      bannedBy: adminId
    };

    // Add to ban history
    if (!user.banStatus.banHistory) {
      user.banStatus.banHistory = [];
    }
    user.banStatus.banHistory.push(banRecord);

    await user.save();
    return user;
  }

  async unbanUser(userId, adminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.banStatus.isBanned) {
      throw new Error('User is not banned');
    }

    // Update the last ban record in history with unban info
    if (user.banStatus.banHistory.length > 0) {
      const lastBan = user.banStatus.banHistory[user.banStatus.banHistory.length - 1];
      lastBan.unbannedAt = new Date();
      lastBan.unbannedBy = adminId;
    }

    // Clear current ban status
    user.banStatus = {
      isBanned: false,
      banHistory: user.banStatus.banHistory // Preserve ban history
    };

    await user.save();
    return user;
  }

  async checkBanStatus(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user.banStatus;
  }
}

module.exports = new UserService();
