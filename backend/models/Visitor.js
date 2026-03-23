const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userType: {
    type: String,
    enum: ['guest', 'learner', 'admin', 'super_admin'],
    default: 'guest'
  },
  visitedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

visitorSchema.index({ ipAddress: 1, userAgent: 1 });
visitorSchema.index({ userId: 1 });
visitorSchema.index({ visitedAt: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
