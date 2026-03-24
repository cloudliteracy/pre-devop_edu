const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  questions: [{
    questionText: {
      type: String,
      required: true,
      maxlength: 300
    },
    questionType: {
      type: String,
      enum: ['single', 'multiple', 'open', 'file_upload'],
      required: true
    },
    allowedFileTypes: {
      type: [String],
      enum: ['pdf', 'video', 'link'],
      default: ['pdf', 'video', 'link']
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    options: [{
      text: {
        type: String,
        maxlength: 150
      }
    }],
    responses: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      answer: mongoose.Schema.Types.Mixed, // Array of numbers for multiple, number for single, string for open, object for file_upload
      files: [{
        fileType: {
          type: String,
          enum: ['pdf', 'video', 'link']
        },
        fileName: String,
        filePath: String,
        fileSize: Number,
        linkUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }],
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

pollSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Poll', pollSchema);
