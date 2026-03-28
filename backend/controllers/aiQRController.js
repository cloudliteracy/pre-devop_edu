const AIKnowledgeDocument = require('../models/AIKnowledgeDocument');
const AIChatConversation = require('../models/AIChatConversation');
const aiQRService = require('../services/aiQRService');
const path = require('path');

/**
 * Send message to AI and get response
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Get or create conversation
    let conversation = await AIChatConversation.findOne({
      userId,
      isActive: true
    });

    if (!conversation) {
      conversation = new AIChatConversation({
        userId,
        messages: []
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      deliveryStatus: 'sent'
    });

    // Get conversation history (last 10 messages for context)
    const recentHistory = conversation.messages.slice(-10);

    // Generate AI response
    const aiResponse = await aiQRService.generateResponse(message, recentHistory);

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
      isOutOfScope: aiResponse.isOutOfScope,
      deliveryStatus: 'delivered'
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      success: true,
      message: aiResponse.message,
      isOutOfScope: aiResponse.isOutOfScope,
      conversationId: conversation._id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI response'
    });
  }
};

/**
 * Get conversation history
 */
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversation = await AIChatConversation.findOne({
      userId,
      isActive: true
    }).select('messages knowledgeBaseVersion lastMessageAt');

    if (!conversation) {
      return res.json({
        success: true,
        messages: [],
        conversationId: null
      });
    }

    res.json({
      success: true,
      messages: conversation.messages,
      conversationId: conversation._id,
      knowledgeBaseVersion: conversation.knowledgeBaseVersion,
      lastMessageAt: conversation.lastMessageAt
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load conversation'
    });
  }
};

/**
 * Clear conversation history
 */
exports.clearConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    await AIChatConversation.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Conversation cleared successfully'
    });

  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear conversation'
    });
  }
};

/**
 * Upload knowledge base document
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = new AIKnowledgeDocument({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      status: 'pending'
    });

    await document.save();

    // Automatically index the document
    try {
      await aiQRService.indexDocument(document._id);
    } catch (indexError) {
      console.error('Auto-indexing failed:', indexError);
      // Document is saved but indexing failed - will show in pending
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully. Click "Refresh Knowledge" to activate.',
      document: {
        id: document._id,
        fileName: document.originalName,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

/**
 * Get all knowledge base documents
 */
exports.getDocuments = async (req, res) => {
  try {
    const documents = await AIKnowledgeDocument.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id,
        fileName: doc.originalName,
        fileSize: doc.fileSize,
        status: doc.status,
        isIndexed: doc.isIndexed,
        indexedAt: doc.indexedAt,
        textLength: doc.textLength,
        pageCount: doc.metadata?.pageCount,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.createdAt,
        errorMessage: doc.errorMessage
      }))
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load documents'
    });
  }
};

/**
 * Download knowledge base document
 */
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await AIKnowledgeDocument.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.download(document.filePath, document.originalName);

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
};

/**
 * Delete knowledge base document
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await AIKnowledgeDocument.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    const fs = require('fs').promises;
    try {
      await fs.unlink(document.filePath);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }

    await AIKnowledgeDocument.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Document deleted successfully. Click "Refresh Knowledge" to update AI.'
    });

  } catch (error) {
    console.error('Document delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};

/**
 * Refresh knowledge base (manual trigger by super admin)
 */
exports.refreshKnowledge = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await aiQRService.refreshKnowledgeBase(userId);

    res.json({
      success: true,
      message: 'Knowledge base refreshed successfully',
      ...result
    });

  } catch (error) {
    console.error('Knowledge refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh knowledge base'
    });
  }
};

/**
 * Get knowledge base statistics
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await aiQRService.getKnowledgeBaseStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load statistics'
    });
  }
};

/**
 * Mark messages as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageIds } = req.body;

    await AIChatConversation.updateOne(
      { userId, isActive: true },
      {
        $set: {
          'messages.$[elem].deliveryStatus': 'read'
        }
      },
      {
        arrayFilters: [{ 'elem._id': { $in: messageIds } }]
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};
