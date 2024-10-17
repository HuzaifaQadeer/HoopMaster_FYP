const User = require('../models/userModel');
const VerificationCode = require('../models/verficationcodeModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs').promises;

exports.registerUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (await User.findOne({ displayName })) {
      return res.status(400).json({ message: 'Username already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashedPassword,
      displayName,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ token, user: { id: user._id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.logoutUser = (req, res) => {
  // Client-side logout, just send a success response
  res.json({ message: 'Logged out successfully' });
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password does not meet requirements' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    user.password = hashedPassword;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('getProfile called for user:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found for id:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', user);
    res.json(user);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      const fileExtension = path.extname(file.name);
      const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
      const uploadPath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', uniqueFilename);

      await file.mv(uploadPath);
      updates.profilePicture = uniqueFilename;
    }

    // Parse JSON strings for object fields
    ['socialMedia', 'height', 'weight', 'wingspan', 'verticalJump'].forEach(field => {
      if (updates[field]) {
        updates[field] = JSON.parse(updates[field]);
      }
    });

    // Convert measurements
    ['height', 'weight', 'wingspan', 'verticalJump'].forEach(field => {
      if (updates[field]) {
        updates[field] = convertMeasurement(updates[field], field);
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If there was an old profile picture, delete it
    if (user.profilePicture && user.profilePicture !== updates.profilePicture) {
      const oldPicturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', user.profilePicture);
      await fs.unlink(oldPicturePath).catch(err => console.error('Error deleting old profile picture:', err));
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Helper function to convert measurements
function convertMeasurement(measurement, field) {
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

exports.togglePrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isPrivate = !user.isPrivate;
    await user.save();
    res.json({ isPrivate: user.isPrivate });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling privacy', error: error.message });
  }
};

exports.upgradeToPremium = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Implement premium upgrade logic here (e.g., payment processing)
    user.isPremium = true;
    await user.save();
    res.json({ isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ message: 'Error upgrading to premium', error: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    // Implement file upload logic here
    const imageUrl = 'path/to/uploaded/image.jpg';
    const user = await User.findByIdAndUpdate(req.user.id, { profilePicture: imageUrl }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile picture', error: error.message });
  }
};

exports.updateHighlightVideo = async (req, res) => {
  try {
    // Implement video upload logic here
    const videoUrl = 'path/to/uploaded/video.mp4';
    const user = await User.findByIdAndUpdate(req.user.id, { highlightVideo: videoUrl }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating highlight video', error: error.message });
  }
};

exports.addCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { courses: courseId } },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error adding course', error: error.message });
  }
};


exports.addAchievement = async (req, res) => {
  try {
    const { achievementId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { achievements: achievementId } },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error adding achievement', error: error.message });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body; 

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing verification code for this email
    await VerificationCode.deleteOne({ userEmail: email });

    // Create a new verification code entry
    await VerificationCode.create({
      userEmail: email,
      code: verificationCode
    });

    // Set up automatic deletion after 10 minutes
    setTimeout(async () => {
      await VerificationCode.deleteOne({ userEmail: email, code: verificationCode });
    }, 10 * 60 * 1000);

    await sendEmail({
      email: email,
      subject: 'Email Verification',
      message: `Your email verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending verification email', error: error.message });
  }
};

exports.checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.json({ message: 'User does not exist' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking user existence', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const verificationEntry = await VerificationCode.findOne({ userEmail: email, code: code });

    if (!verificationEntry) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Delete the verification code entry
    await VerificationCode.deleteOne({ _id: verificationEntry._id });

    // Update user's email verification status
    await User.updateOne({ email }, { $set: { isEmailVerified: true } });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const {userId} = req.body; // Get the user ID from the authenticated request

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated files if they exist
    if (deletedUser.profilePicture) {
      const profilePicturePath = path.join(__dirname, '..', '..', 'Server', 'profilePictures', deletedUser.profilePicture);
      await fs.unlink(profilePicturePath).catch(err => console.error('Error deleting profile picture:', err));
    }

    if (deletedUser.highlightVideo) {
      const highlightVideoPath = path.join(__dirname, '..', '..', 'Server', 'highlights', deletedUser.highlightVideo);
      await fs.unlink(highlightVideoPath).catch(err => console.error('Error deleting highlight video:', err));
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
    // Delete all users
    const result = await User.deleteMany({});

    // Delete all profile pictures and highlight videos
    const profilePicturesDir = path.join(__dirname, '..', '..', 'Server', 'profilePictures');
    const highlightsDir = path.join(__dirname, '..', '..', 'Server', 'highlights');

    await fs.readdir(profilePicturesDir)
      .then(files => Promise.all(files.map(file => fs.unlink(path.join(profilePicturesDir, file)))))
      .catch(err => console.error('Error deleting profile pictures:', err));

    await fs.readdir(highlightsDir)
      .then(files => Promise.all(files.map(file => fs.unlink(path.join(highlightsDir, file)))))
      .catch(err => console.error('Error deleting highlight videos:', err));

    res.json({ message: `${result.deletedCount} users deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all users', error: error.message });
  }
};