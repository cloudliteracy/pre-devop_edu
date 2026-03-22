const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: 500
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    originalName: String,
    fileType: String, // 'image', 'document', 'video', 'audio'
    fileUrl: String,
    fileSize: Number,
    mimeType: String
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String // 'like', 'heart', 'laugh', 'wow', 'sad', 'angry'
  }]
}, {
  timestamps: true
});

commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });

commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);
