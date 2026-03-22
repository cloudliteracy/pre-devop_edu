const Comment = require('../models/Comment');
const ChatSettings = require('../models/ChatSettings');
const path = require('path');

// Helper function to determine file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
};

// Get all comments with nested replies
exports.getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const topLevelComments = await Comment.find({ parentComment: null })
      .populate('user', 'name email role')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get replies for each top-level comment
    for (let comment of topLevelComments) {
      const replies = await Comment.find({ parentComment: comment._id })
        .populate('user', 'name email role')
        .populate('reactions.user', 'name')
        .sort({ createdAt: 1 })
        .lean();
      comment.replies = replies;
    }

    const total = await Comment.countDocuments({ parentComment: null });

    res.json({
      comments: topLevelComments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new comment
exports.createComment = async (req, res) => {
  try {
    const { content } = req.body;

    // Content is optional if files are attached
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Content or files are required' });
    }

    if (content && content.length > 500) {
      return res.status(400).json({ message: 'Content must be 500 characters or less' });
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          fileType: getFileType(file.mimetype),
          fileUrl: `/uploads/community/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype
        });
      });
    }

    const comment = new Comment({
      user: req.user._id,
      content: content ? content.trim() : '',
      attachments
    });

    await comment.save();
    await comment.populate('user', 'name email role');

    // Broadcast to all connected clients
    const io = req.app.get('io');
    io.emit('new-comment', comment);

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reply to a comment
exports.replyToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Content is optional if files are attached
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Content or files are required' });
    }

    if (content && content.length > 500) {
      return res.status(400).json({ message: 'Content must be 500 characters or less' });
    }

    const parentComment = await Comment.findById(id);
    if (!parentComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          fileType: getFileType(file.mimetype),
          fileUrl: `/uploads/community/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype
        });
      });
    }

    const reply = new Comment({
      user: req.user._id,
      content: content ? content.trim() : '',
      parentComment: id,
      attachments
    });

    await reply.save();
    await reply.populate('user', 'name email role');

    // Broadcast to all connected clients
    const io = req.app.get('io');
    io.emit('new-reply', { reply, parentCommentId: id });

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Edit own comment
exports.editComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: 'Content must be 500 characters or less' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();
    await comment.populate('user', 'name email role');

    const io = req.app.get('io');
    io.emit('comment-edited', comment);

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete comment (own comment or admin)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Delete all replies if it's a parent comment
    if (!comment.parentComment) {
      await Comment.deleteMany({ parentComment: id });
    }

    await Comment.findByIdAndDelete(id);

    const io = req.app.get('io');
    io.emit('comment-deleted', { commentId: id, parentCommentId: comment.parentComment });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add or update reaction to comment
exports.addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    // Expanded list of valid emojis
    const validEmojis = [
      // Emotions
      'smile', 'laugh', 'love', 'heart_eyes', 'sad', 'angry', 'wow', 'thinking', 'cool', 'party',
      // Gestures
      'thumbs_up', 'thumbs_down', 'clap', 'raised_hands', 'handshake', 'muscle', 'pray', 'ok_hand',
      // Symbols
      'heart', 'fire', 'star', 'check', 'cross', 'hundred', 'party_popper', 'rocket',
      // Objects
      'bulb', 'books', 'target', 'trophy', 'lightning', 'medal', 'brain'
    ];
    
    if (!validEmojis.includes(emoji)) {
      return res.status(400).json({ message: 'Invalid emoji' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already reacted
    const existingReaction = comment.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.emoji = emoji;
    } else {
      // Add new reaction
      comment.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await comment.save();
    await comment.populate('user', 'name email role');
    await comment.populate('reactions.user', 'name');

    const io = req.app.get('io');
    io.emit('comment-reaction', comment);

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove reaction from comment
exports.removeReaction = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.reactions = comment.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    await comment.save();
    await comment.populate('user', 'name email role');
    await comment.populate('reactions.user', 'name');

    const io = req.app.get('io');
    io.emit('comment-reaction', comment);

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get chat settings
exports.getChatSettings = async (req, res) => {
  try {
    let settings = await ChatSettings.findOne();
    if (!settings) {
      settings = await ChatSettings.create({ isEnabled: true });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle chat enabled/disabled (admin only)
exports.toggleChat = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let settings = await ChatSettings.findOne();
    if (!settings) {
      settings = await ChatSettings.create({ isEnabled: true });
    }

    settings.isEnabled = !settings.isEnabled;
    settings.disabledBy = settings.isEnabled ? null : req.user._id;
    settings.disabledAt = settings.isEnabled ? null : new Date();

    await settings.save();

    const io = req.app.get('io');
    io.emit('chat-status-changed', { isEnabled: settings.isEnabled });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
