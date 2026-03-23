const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  moduleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Module', 
    required: true 
  },
  videosWatched: [{ type: String }],
  pdfsDownloaded: [{ type: String }],
  videoCompleted: { type: Boolean, default: false },
  markdownViewed: { type: Boolean, default: false },
  quizCompleted: { type: Boolean, default: false },
  quizScore: { type: Number, default: 0 },
  quizAttempts: [{
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      userAnswer: Number
    }],
    score: Number,
    passed: Boolean,
    certificateId: String,
    attemptedAt: { type: Date, default: Date.now }
  }],
  completionPercentage: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

progressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
