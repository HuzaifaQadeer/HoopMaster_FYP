const adminService = require('../services/adminService');

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await adminService.loginAdmin(email, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const admin = await adminService.createAdmin(email, password, name);
    res.status(201).json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.logoutAdmin = async (req, res) => {
  try {
    await adminService.logoutAdmin(req.admin.id);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await adminService.changePassword(req.admin.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
