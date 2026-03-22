const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 200
  },
  options: [{
    text: {
      type: String,
      required: true,
      maxlength: 100
    },
    votes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
