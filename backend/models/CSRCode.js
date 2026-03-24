const mongoose = require('mongoose');

const csrCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  codeName: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    required: true,
    min: 1
  },
  accessDurationMonths: {
    type: Number,
    required: true,
    min: 1,
    default: 12
  },
  currentUses: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

csrCodeSchema.index({ code: 1 });
csrCodeSchema.index({ expiresAt: 1 });
csrCodeSchema.index({ isActive: 1 });

module.exports = mongoose.model('CSRCode', csrCodeSchema);
