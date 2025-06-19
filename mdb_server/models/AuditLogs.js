const mongoose = require('mongoose');

const auditLogsSchema = new mongoose.Schema({
  logId: String,
  userId: String,
  action: String,
  tableName: String,
  recordId: String,
  actionDate: Date,
  details: String
});

module.exports = mongoose.model('AuditLogs', auditLogsSchema);