const mongoose = require('mongoose');

const affiliatePartnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  commissionRate: {
    type: Number,
    default: 25 // 25% commission
  },
  paymentMethod: {
    type: String,
    enum: ['PayPal', 'Bank Transfer', 'MTN MoMo', 'Orange Money'],
    default: 'PayPal'
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  pendingEarnings: {
    type: Number,
    default: 0
  },
  paidEarnings: {
    type: Number,
    default: 0
  },
  minimumPayout: {
    type: Number,
    default: 50 // $50 USD
  },
  applicationMessage: {
    type: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('AffiliatePartner', affiliatePartnerSchema);
