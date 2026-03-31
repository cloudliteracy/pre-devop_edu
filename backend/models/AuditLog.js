const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    enum: [
      'LOGIN_ATTEMPT', 
      'LOCATION_UPDATE', 
      'USER_DELETE', 
      'PARTNER_DELETE', 
      'ADMIN_DELETE', 
      'USER_SUSPEND', 
      'PARTNER_SUSPEND',
      'ADMIN_SUSPEND',
      'PARTNER_CODE_GENERATE',
      'PARTNER_CODE_REVOKE'
    ], 
    required: true 
  },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserEmail: { type: String },
  targetUserName: { type: String },
  ip: { type: String },
  country: { type: String },
  details: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
