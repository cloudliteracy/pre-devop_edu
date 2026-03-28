const mongoose = require('mongoose');

const aiChatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isOutOfScope: {
      type: Boolean,
      default: false
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    }
  }],
  knowledgeBaseVersion: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

aiChatConversationSchema.index({ userId: 1, isActive: 1 });
aiChatConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('AIChatConversation', aiChatConversationSchema);
