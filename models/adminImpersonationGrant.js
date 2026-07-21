const mongoose = require('mongoose');

const AdminImpersonationGrantSchema = new mongoose.Schema({
  codeHash: { type: String, required: true, unique: true, index: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  adminEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

module.exports = mongoose.model('adminImpersonationGrant', AdminImpersonationGrantSchema);
