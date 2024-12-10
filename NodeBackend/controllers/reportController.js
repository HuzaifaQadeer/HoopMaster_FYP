const reportService = require('../services/reportService');

exports.createReport = async (req, res) => {
  try {
    const { contentType, contentId, reason, comment } = req.body;
    const report = await reportService.createReport(
      req.user.id,
      contentType,
      contentId,
      reason,
      comment
    );
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await reportService.getAllReports();
    res.json(reports);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
