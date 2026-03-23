const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  order: { type: Number, required: true },
  videoUrl: { type: String },
  markdownContent: { type: String },
  markdownImages: [{
    filename: String,
    path: String
  }],
  pdfs: [{
    title: String,
    filename: String,
    path: String
  }],
  videos: [{
    title: String,
    filename: String,
    path: String,
    duration: String
  }],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number
    }],
    passingScore: { type: Number, default: 70 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);
