const Admin = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (email, password) => {
  const admin = await Admin.findOne({ email });
  console.log('Found admin:', admin ? 'yes' : 'no');
  
  if (!admin) {
    throw new Error('Invalid credentials');
  }

  console.log('Comparing passwords...');
  console.log('Provided password:', password);
  console.log('Stored hashed password:', admin.password);
  
  const isMatch = await bcrypt.compare(password, admin.password);
  console.log('Password match:', isMatch);

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });

  return { token, admin: { id: admin._id, email: admin.email, name: admin.name } };
};

exports.createAdmin = async (email, password, name) => {
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new Error('Admin already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = new Admin({
    email,
    password: hashedPassword,
    name
  });

  await admin.save();
  return { id: admin._id, email: admin.email, name: admin.name };
};

exports.changePassword = async (adminId, currentPassword, newPassword) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  admin.password = hashedPassword;
  await admin.save();
};

exports.logoutAdmin = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }
  return true;
};
