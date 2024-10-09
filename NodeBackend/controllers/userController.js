const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
//const sendEmail = require('../utils/sendEmail');

exports.registerUser = async (req, res) => {
  try {
    const { email, password} = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashedPassword,
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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send reset token to frontend instead of a URL
    await sendEmail({
      email: user.email,
      subject: 'Password Reset',
      message: `Your password reset code is: ${resetToken}\n\nThis code will expire in 10 minutes.`
    });

    res.json({ message: 'Password reset code sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending password reset email', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password does not meet requirements' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Convert measurements if necessary
    if (updates.height) {
      updates.height = convertMeasurement(updates.height, ['cm', 'ft'], 'cm');
    }
    if (updates.weight) {
      updates.weight = convertMeasurement(updates.weight, ['kg', 'lbs'], 'kg');
    }
    if (updates.wingspan) {
      updates.wingspan = convertMeasurement(updates.wingspan, ['cm', 'in'], 'cm');
    }
    if (updates.verticalJump) {
      updates.verticalJump = convertMeasurement(updates.verticalJump, ['cm', 'in'], 'cm');
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Helper function to convert measurements
function convertMeasurement(measurement, allowedUnits, defaultUnit) {
  if (!measurement.unit || !allowedUnits.includes(measurement.unit)) {
    measurement.unit = defaultUnit;
  }
  
  if (measurement.unit !== defaultUnit) {
    // Perform conversion
    if (defaultUnit === 'cm' && measurement.unit === 'ft') {
      measurement.value = measurement.value * 30.48;
    } else if (defaultUnit === 'cm' && measurement.unit === 'in') {
      measurement.value = measurement.value * 2.54;
    } else if (defaultUnit === 'kg' && measurement.unit === 'lbs') {
      measurement.value = measurement.value * 0.453592;
    }
    measurement.unit = defaultUnit;
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

exports.updateCourseProgress = async (req, res) => {
  try {
    const { courseId, progress } = req.body;
    // Implement course progress update logic here
    res.json({ message: 'Course progress updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating course progress', error: error.message });
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email/${verificationToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message: `Please click on the following link to verify your email: ${verificationUrl}`
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending verification email', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};