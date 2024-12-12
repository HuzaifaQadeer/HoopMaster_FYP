const User = require('../models/userModel');
const VerificationCode = require('../models/verficationcodeModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs').promises;

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
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    return { token, user: { id: user._id, email: user.email, displayName: user.displayName } };
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

    if (profilePicture) {
      if (currentUser.profilePicture) {
        const oldPicturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', currentUser.profilePicture);
        await fs.unlink(oldPicturePath).catch(err => console.error('Error deleting old profile picture:', err));
      }

      const fileExtension = path.extname(profilePicture.name);
      const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
      const uploadPath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', uniqueFilename);

      await profilePicture.mv(uploadPath);
      updates.profilePicture = uniqueFilename;
    }

    ['socialMedia', 'height', 'weight', 'wingspan', 'verticalJump'].forEach(field => {
      if (updates[field]) {
        updates[field] = JSON.parse(updates[field]);
      }
    });

    ['height', 'weight', 'wingspan', 'verticalJump'].forEach(field => {
      if (updates[field]) {
        updates[field] = this.convertMeasurement(updates[field], field);
      }
    });

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  convertMeasurement(measurement, field) {
    const conversionMap = {
      height: { from: 'ft', to: 'cm', factor: 30.48 },
      weight: { from: 'lbs', to: 'kg', factor: 0.453592 },
      wingspan: { from: 'in', to: 'cm', factor: 2.54 },
      verticalJump: { from: 'in', to: 'cm', factor: 2.54 }
    };

    const conversion = conversionMap[field];
    if (!conversion) return measurement;

    if (measurement.unit === conversion.from) {
      measurement.value = parseFloat(measurement.value) * conversion.factor;
      measurement.unit = conversion.to;
    }

    return measurement;
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
    await user.save();
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
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      throw new Error('User not found');
    }

    if (deletedUser.profilePicture) {
      const profilePicturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', deletedUser.profilePicture);
      await fs.unlink(profilePicturePath).catch(err => console.error('Error deleting profile picture:', err));
    }

    if (deletedUser.highlightVideo) {
      const highlightVideoPath = path.join(__dirname, '..', '..', 'Server', 'highlights', deletedUser.highlightVideo);
      await fs.unlink(highlightVideoPath).catch(err => console.error('Error deleting highlight video:', err));
    }
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

  async getTotalRevenue() {
    const users = await User.find();
    return users.reduce((total, user) => total + (user.totalSpent || 0), 0);
  }

  async getUsersGrowthThreeMonths() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return await User.find({ createdAt: { $gte: threeMonthsAgo } })
      .sort('createdAt');
  }

  async getUsersGrowthYear() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return await User.find({ createdAt: { $gte: oneYearAgo } })
      .sort('createdAt');
  }

  async getUsersGrowthLifetime() {
    return await User.find().sort('createdAt');
  }

  async getRevenueGrowthThreeMonths() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return await User.find({ 
      createdAt: { $gte: threeMonthsAgo },
      totalSpent: { $gt: 0 }
    }).sort('createdAt');
  }

  async getRevenueGrowthYear() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return await User.find({ 
      createdAt: { $gte: oneYearAgo },
      totalSpent: { $gt: 0 }
    }).sort('createdAt');
  }

  async getRevenueGrowthLifetime() {
    return await User.find({ totalSpent: { $gt: 0 } }).sort('createdAt');
  }

  async getPremiumSubscriptionsThreeMonths() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return await User.find({ 
      'premiumHistory.subscribedAt': { $gte: threeMonthsAgo }
    }).sort('premiumHistory.subscribedAt');
  }

  async getPremiumSubscriptionsYear() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return await User.find({ 
      'premiumHistory.subscribedAt': { $gte: oneYearAgo }
    }).sort('premiumHistory.subscribedAt');
  }

  async getPremiumSubscriptionsLifetime() {
    return await User.find({ 
      'premiumHistory.subscribedAt': { $exists: true }
    }).sort('premiumHistory.subscribedAt');
  }

  async getPremiumUnsubscriptionsThreeMonths() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return await User.find({ 
      'premiumHistory.unsubscribedAt': { $gte: threeMonthsAgo }
    }).sort('premiumHistory.unsubscribedAt');
  }

  async getPremiumUnsubscriptionsYear() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return await User.find({ 
      'premiumHistory.unsubscribedAt': { $gte: oneYearAgo }
    }).sort('premiumHistory.unsubscribedAt');
  }
 
  async getPremiumUnsubscriptionsLifetime() {
    return await User.find({ 
      'premiumHistory.unsubscribedAt': { $exists: true }
    }).sort('premiumHistory.unsubscribedAt');
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

  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { message: 'User deleted successfully' };
  }
}

module.exports = new UserService();
