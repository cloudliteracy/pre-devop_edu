const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isGifted: {
    type: Boolean,
    default: false
  },
  giftedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  giftedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  giftedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
