const Report = require('../models/reportModel');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

exports.createReport = async (reporterId, contentType, contentId, reason, comment) => {
  const reportedContent = await getReportedContent(contentType, contentId);
  if (!reportedContent) {
    throw new Error('Reported content not found');
  }

  const report = new Report({
    reporter: reporterId,
    reported: reportedContent.user || contentId,
    contentType,
    contentId,
    reason,
    comment
  });

  await report.save();
  return report;
};

exports.getAllReports = async () => {
  return await Report.find()
    .populate('reporter', 'displayName email')
    .populate('reported', 'displayName email')
    .populate('adminAction.admin', 'name email')
    .sort('-createdAt');
};

const getReportedContent = async (contentType, contentId) => {
  switch (contentType) {
    case 'post':
      return await Post.findById(contentId);
    case 'comment':
      return await Comment.findById(contentId);
    case 'user':
      return await User.findById(contentId);
    default:
      throw new Error('Invalid content type');
  }
};

exports.getReportById = async (reportId) => {
  const report = await Report.findById(reportId)
    .populate('reporter', 'displayName email')
    .populate('reported', 'displayName email')
    .populate('adminAction.admin', 'name email');
    
  if (!report) {
    throw new Error('Report not found');
  }
  
  return report;
};

exports.resolveReport = async (reportId, adminId) => {
  const report = await Report.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  report.resolved = true;
  report.status = 'resolved';
  report.adminAction = {
    admin: adminId,
    action: 'resolved',
    date: new Date(),
  };

  await report.save();
  return report;
};
