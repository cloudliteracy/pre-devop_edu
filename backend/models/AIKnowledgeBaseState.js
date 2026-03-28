const mongoose = require('mongoose');

const aiKnowledgeBaseStateSchema = new mongoose.Schema({
  lastRefreshedAt: {
    type: Date,
    required: true
  },
  refreshedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activeDocuments: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIKnowledgeDocument'
    },
    fileName: String,
    textLength: Number
  }],
  totalDocuments: {
    type: Number,
    default: 0
  },
  totalTextLength: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'refreshing', 'failed'],
    default: 'active'
  },
  refreshDuration: {
    type: Number // milliseconds
  }
}, {
  timestamps: true
});

// Only keep one active state (singleton pattern)
aiKnowledgeBaseStateSchema.index({ version: -1 });

module.exports = mongoose.model('AIKnowledgeBaseState', aiKnowledgeBaseStateSchema);
