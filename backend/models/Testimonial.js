const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  testimonialText: {
    type: String,
    required: true,
    maxlength: 500
  },
  profilePhoto: String,
  isApproved: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

testimonialSchema.index({ isApproved: 1, isFeatured: 1 });
testimonialSchema.index({ userId: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
