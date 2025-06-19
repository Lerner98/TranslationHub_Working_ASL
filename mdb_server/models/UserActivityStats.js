const mongoose = require('mongoose');

const userActivityStatsSchema = new mongoose.Schema({
  userId: String,
  textTranslationCount: Number,
  voiceTranslationCount: Number,
  sessionCount: Number,
  lastActive: Date,
  computedAt: Date
});

module.exports = mongoose.model('UserActivityStats', userActivityStatsSchema);