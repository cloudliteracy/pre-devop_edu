const mongoose = require('mongoose');

const voucherActivityLogSchema = new mongoose.Schema({
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['created', 'assigned', 'redeemed', 'expired', 'revoked', 'bulk_upload'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

voucherActivityLogSchema.index({ action: 1, performedAt: -1 });

module.exports = mongoose.model('VoucherActivityLog', voucherActivityLogSchema);
