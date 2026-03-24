const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  examType: {
    type: String,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['unused', 'assigned', 'redeemed', 'expired', 'revoked'],
    default: 'unused',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  redeemedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    batchId: String,
    notes: String
  }
}, {
  timestamps: true
});

voucherSchema.index({ status: 1, expirationDate: 1 });
voucherSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
