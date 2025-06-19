const mongoose = require('mongoose');
const axios = require('axios');
const axiosRetry = require('axios-retry');

const TranslationStats = mongoose.model('TranslationStats', new mongoose.Schema({
  userId: String,
  fromLang: String,
  toLang: String,
  translationCount: Number,
  lastUpdated: Date
}));
const UserActivityStats = mongoose.model('UserActivityStats', new mongoose.Schema({
  userId: String,
  textTranslationCount: Number,
  voiceTranslationCount: Number,
  sessionCount: Number,
  lastActive: Date,
  computedAt: Date
}));
const AuditLogs = mongoose.model('AuditLogs', new mongoose.Schema({
  logId: String,
  userId: String,
  action: String,
  tableName: String,
  recordId: String,
  actionDate: Date,
  details: String
}));

// Configure axios retries
axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 1000 });

// MongoDB Connection
mongoose.connect('mongodb://adminUser:adminPass123@127.0.0.1:27017/translationhub?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function syncMssqlToMongo() {
  try {
    // Sync TranslationStats
    const translationStatsResponse = await axios.get('http://localhost:3000/statistics-for-sync');
    const translationStats = translationStatsResponse.data.map(record => ({
      userId: record.user_id,
      fromLang: record.from_lang,
      toLang: record.to_lang,
      translationCount: record.translation_count,
      lastUpdated: new Date(record.last_updated)
    }));
    await TranslationStats.deleteMany({});
    await TranslationStats.insertMany(translationStats);
    console.log('TranslationStats synced');

    // Sync UserActivityStats
    const userActivityStatsResponse = await axios.get('http://localhost:3000/user-activity-stats-for-sync');
    const userActivityStats = userActivityStatsResponse.data.map(record => ({
      userId: record.userId,
      textTranslationCount: record.textTranslationCount,
      voiceTranslationCount: record.voiceTranslationCount,
      sessionCount: record.sessionCount,
      lastActive: record.lastActive ? new Date(record.lastActive) : null,
      computedAt: new Date(record.computedAt)
    }));
    await UserActivityStats.deleteMany({});
    await UserActivityStats.insertMany(userActivityStats);
    console.log('UserActivityStats synced');

    // Sync AuditLogs
    const auditLogsResponse = await axios.get('http://localhost:3000/audit-logs-for-sync');
    const auditLogs = auditLogsResponse.data.map(record => ({
      logId: record.log_id,
      userId: record.user_id,
      action: record.action,
      tableName: record.table_name,
      recordId: record.record_id,
      actionDate: new Date(record.action_date),
      details: record.details
    }));
    await AuditLogs.deleteMany({});
    await AuditLogs.insertMany(auditLogs);
    console.log('AuditLogs synced');

  } catch (error) {
    console.error('Error syncing MSSQL to MongoDB:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

syncMssqlToMongo();