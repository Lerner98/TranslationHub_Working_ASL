const mongoose = require('mongoose');

const translationStatsSchema = new mongoose.Schema({
  userId: String,
  fromLang: String,
  toLang: String,
  translationCount: Number,
  lastUpdated: Date
});

module.exports = mongoose.model('TranslationStats', translationStatsSchema);