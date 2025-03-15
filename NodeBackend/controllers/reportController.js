const Report = require('../models/reportModel');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { reason, contentType, contentId } = req.body;
    
    if (!reason || !contentType || !contentId) {
      return res.status(400).json({ message: 'Reason, content type, and content ID are required' });
    }
    
    // Validate content type
    if (contentType !== 'post' && contentType !== 'comment') {
      return res.status(400).json({ message: 'Content type must be "post" or "comment"' });
    }
    
    // Verify the content exists
    let content;
    if (contentType === 'post') {
      content = await Post.findById(contentId);
    } else {
      content = await Comment.findById(contentId);
    }
    
    if (!content) {
      return res.status(404).json({ message: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} not found` });
    }
    
    // Check if user has already reported this content
    const existingReport = await Report.findOne({
      contentType,
      contentId,
      reporter: req.user._id
    });
    
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this content' });
    }
    
    // Create the report
    const newReport = new Report({
      reason,
      contentType,
      contentId,
      reporter: req.user._id
    });
    
    await newReport.save();
    
    // Add report to content's reports array
    content.reports.push(newReport._id);
    await content.save();
    
    res.status(201).json({ 
      message: 'Report submitted successfully',
      report: {
        _id: newReport._id,
        reason: newReport.reason,
        contentType: newReport.contentType,
        status: newReport.status,
        createdAt: newReport.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error submitting report' });
  }
};

// Get all reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    console.log('Getting all reports, user:', req.user ? `${req.user._id}` : 'not authenticated');
    
    const { status, contentType, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (contentType) query.contentType = contentType;
    
    console.log('Report query:', JSON.stringify(query));
    
    // Get reports
    const reports = await Report.find(query)
      .populate('reporter', 'displayName username')
      .populate('reviewedBy', 'displayName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('Found reports:', reports.length);
      
    // Get total count for pagination
    const total = await Report.countDocuments(query);
    
    return res.status(200).json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Error retrieving reports' });
  }
};

// Get report details
exports.getReport = async (req, res) => {
  try {
    console.log('Getting report details, user:', req.user ? `${req.user._id}` : 'not authenticated');
    
    const report = await Report.findById(req.params.reportId)
      .populate('reporter', 'displayName email')
      .populate('reported', 'displayName email')
      .populate('adminAction.admin', 'name email');
      
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Get the reported content
    let content = null;
    if (report.contentType === 'post') {
      content = await Post.findById(report.contentId)
        .populate('user', 'displayName email profilePicture');
    } else if (report.contentType === 'comment') {
      content = await Comment.findById(report.contentId)
        .populate('user', 'displayName email profilePicture');
    }
    
    if (!content) {
      return res.status(404).json({ message: 'Reported content not found' });
    }

    const response = {
      id: report._id,
      userId: content.user._id,
      contentId: report.contentId,
      contentType: report.contentType,
      reason: report.reason,
      content: content.content || content.text,
      date: report.createdAt,
      media: content.media,
      reported: {
        _id: content.user._id,
        email: content.user.email,
        displayName: content.user.displayName
      },
      reporter: {
        _id: report.reporter._id,
        email: report.reporter.email,
        displayName: report.reporter.displayName
      },
      status: report.status,
      resolved: report.resolved,
      adminAction: report.adminAction
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ message: 'Error retrieving report' });
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'rejected', 'actioned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update report
    report.status = status;
    report.reviewedBy = req.user._id;
    if (reviewNotes) report.reviewNotes = reviewNotes;
    
    await report.save();
    
    // If status is 'actioned', handle the reported content
    if (status === 'actioned') {
      if (report.contentType === 'post') {
        await Post.findByIdAndUpdate(report.contentId, { isDeleted: true });
      } else if (report.contentType === 'comment') {
        await Comment.findByIdAndUpdate(report.contentId, { isDeleted: true });
      }
    }
    
    res.status(200).json({
      message: 'Report status updated successfully',
      report: {
        _id: report._id,
        status: report.status,
        reviewedBy: report.reviewedBy,
        reviewNotes: report.reviewNotes
      }
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
};

// Resolve report
exports.resolveReport = async (req, res) => {
  try {
    const { action, notes } = req.body;
    
    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }
    
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    report.resolved = true;
    report.status = action;
    report.adminAction = {
      admin: req.user._id,
      action: action,
      date: new Date(),
      notes: notes || ''
    };
    
    await report.save();
    
    res.status(200).json({
      message: 'Report resolved successfully',
      report: {
        id: report._id,
        status: report.status,
        resolved: report.resolved,
        adminAction: report.adminAction
      }
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ message: 'Error resolving report' });
  }
};
