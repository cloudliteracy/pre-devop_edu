const mongoose = require('mongoose');

const aiKnowledgeDocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isIndexed: {
    type: Boolean,
    default: false
  },
  indexedAt: {
    type: Date
  },
  extractedText: {
    type: String
  },
  textLength: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'indexed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String
  },
  metadata: {
    pageCount: Number,
    author: String,
    title: String,
    subject: String
  }
}, {
  timestamps: true
});

aiKnowledgeDocumentSchema.index({ uploadedBy: 1 });
aiKnowledgeDocumentSchema.index({ status: 1 });
aiKnowledgeDocumentSchema.index({ isIndexed: 1 });

module.exports = mongoose.model('AIKnowledgeDocument', aiKnowledgeDocumentSchema);
