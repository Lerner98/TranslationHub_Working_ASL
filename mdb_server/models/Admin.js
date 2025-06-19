const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], default: [] },
  reportIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Report', default: [] },
  permissions: { type: Object, default: { canViewReports: false, canDeleteAdmins: false } },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

adminSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Admin', adminSchema, 'admins');