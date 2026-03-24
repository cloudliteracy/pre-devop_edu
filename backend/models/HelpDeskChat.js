const mongoose = require('mongoose');

const helpDeskChatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userType: {
    type: String,
    enum: ['guest', 'learner'],
    required: true
  },
  guestName: String,
  guestEmail: String,
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'closed'],
    default: 'waiting'
  },
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderType: {
      type: String,
      enum: ['user', 'admin', 'guest']
    },
    encryptedContent: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

helpDeskChatSchema.index({ sessionId: 1 });
helpDeskChatSchema.index({ status: 1 });
helpDeskChatSchema.index({ userId: 1 });

module.exports = mongoose.model('HelpDeskChat', helpDeskChatSchema);
