const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: String },
  type: { type: String, enum: ['error', 'feedback', 'suggestion'], default: 'error' },
  message: { type: String, required: true },
  errorStack: { type: String },
  screen: { type: String },
  deviceInfo: { type: [{ os: String, model: String }], default: [] },
  platform: { type: String },
  appVersion: { type: String },
  extra: { type: mongoose.Schema.Types.Mixed },
  actions: { type: [String], default: [] },
  relatedReports: { type: [mongoose.Schema.Types.ObjectId], ref: 'Report', default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

reportSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema);