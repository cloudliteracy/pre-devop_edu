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
      enum: ['single', 'multiple', 'open'],
      required: true
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
      answer: mongoose.Schema.Types.Mixed, // Array of numbers for multiple, number for single, string for open
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
