const Report = require('../models/Report');
const TranslationStats = require('../models/TranslationStats');
const UserActivityStats = require('../models/UserActivityStats');
const AuditLogs = require('../models/AuditLogs');
const { logDBError } = require('../middleware/log');

/**
 * Submits a new report.
 */
exports.submitReport = async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.MDB_API_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid API key' });
    }

    const { userId, type, message, errorStack, screen, deviceInfo, platform, appVersion, extra, actions, relatedReports } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const report = new Report({
      userId,
      type,
      message,
      errorStack,
      screen,
      deviceInfo,
      platform: platform || "Android",
      appVersion,
      extra,
      actions: actions || [],
      relatedReports: relatedReports || []
    });
    await report.save();

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    logDBError(error, { func: 'submitReport', body: req.body });
    res.status(500).json({ success: false, message: 'Failed to submit report', error: error.message });
  }
};

/**
 * Retrieves a report by ID.
 */
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.status(200).json({ success: true, report });
  } catch (error) {
    logDBError(error, { func: 'getReport', id: req.params.id });
    res.status(500).json({ success: false, message: 'Error fetching report', error: error.message });
  }
};

/**
 * Retrieves all reports, sorted by creation date.
 */
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, reports });
  } catch (error) {
    logDBError(error, { func: 'getAllReports' });
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

/**
 * Updates a report by ID.
 */
exports.updateReport = async (req, res) => {
  try {
    const { type, message, errorStack, screen, deviceInfo, platform, appVersion, extra, actions, relatedReports } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (type) report.type = type;
    if (message) report.message = message;
    if (errorStack) report.errorStack = errorStack;
    if (screen) report.screen = screen;
    if (deviceInfo) report.deviceInfo = deviceInfo;
    if (platform) report.platform = platform;
    if (appVersion) report.appVersion = appVersion;
    if (extra) report.extra = extra;
    if (actions) report.actions = actions;
    if (relatedReports) report.relatedReports = relatedReports;

    await report.save();

    res.status(200).json({ success: true, message: 'Report updated successfully', report });
  } catch (error) {
    logDBError(error, { func: 'updateReport', id: req.params.id, body: req.body });
    res.status(500).json({ success: false, message: 'Error updating report', error: error.message });
  }
};

/**
 * Deletes a report by ID.
 */
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    logDBError(error, { func: 'deleteReport', id: req.params.id });
    res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
};

/**
 * Retrieves the number of errors per day over the last 7 days.
 */
exports.getErrorsByDay = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const reports = await Report.find({
      createdAt: { $gte: startDate },
    });

    const errorsByDay = reports.reduce((acc, report) => {
      const date = report.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({ success: true, errorsByDay });
  } catch (error) {
    logDBError(error, { func: 'getErrorsByDay', startDate: startDate.toISOString() });
    res.status(500).json({ success: false, message: 'Error fetching errors by day', error: error.message });
  }
};

/**
 * Retrieves the most reported messages (top 5).
 */
exports.getMostReported = async (req, res) => {
  try {
    const mostReported = await Report.aggregate([
      { $match: { message: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$message",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const result = mostReported.map(item => [item._id, item.count]);
    res.status(200).json({ success: true, mostReported: result });
  } catch (error) {
    logDBError(error, { func: 'getMostReported' });
    res.status(500).json({ success: false, message: 'Error fetching most reported keywords', error: error.message });
  }
};

/**
 * Retrieves translation statistics for a specific user.
 */
exports.getTranslationStatsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const stats = await TranslationStats.find({ userId }).sort({ translationCount: -1 });
    res.status(200).json({ success: true, stats });
  } catch (error) {
    logDBError(error, { func: 'getTranslationStatsByUser', userId: req.params.userId });
    res.status(500).json({ success: false, message: 'Error fetching translation stats', error: error.message });
  }
};

/**
 * Retrieves the top 5 active users based on session count.
 */
exports.getTopActiveUsers = async (req, res) => {
  try {
    const topUsers = await UserActivityStats.find()
      .sort({ sessionCount: -1 })
      .limit(5);
    res.status(200).json({ success: true, topUsers });
  } catch (error) {
    logDBError(error, { func: 'getTopActiveUsers' });
    res.status(500).json({ success: false, message: 'Error fetching top active users', error: error.message });
  }
};

/**
 * Retrieves recent audit logs for a specific user (last 10).
 */
exports.getRecentAuditLogs = async (req, res) => {
  try {
    const userId = req.params.userId;
    const logs = await AuditLogs.find({ userId })
      .sort({ actionDate: -1 })
      .limit(10);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    logDBError(error, { func: 'getRecentAuditLogs', userId: req.params.userId });
    res.status(500).json({ success: false, message: 'Error fetching audit logs', error: error.message });
  }
};