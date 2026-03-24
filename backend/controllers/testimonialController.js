const Testimonial = require('../models/Testimonial');

// Create testimonial (authenticated users)
exports.createTestimonial = async (req, res) => {
  try {
    const { rating, testimonialText } = req.body;

    if (!rating || !testimonialText) {
      return res.status(400).json({ message: 'Rating and testimonial text are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (testimonialText.length > 500) {
      return res.status(400).json({ message: 'Testimonial text must be 500 characters or less' });
    }

    // Check if user already has a testimonial
    const existing = await Testimonial.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a testimonial. Please edit your existing one.' });
    }

    const testimonial = await Testimonial.create({
      userId: req.user._id,
      rating,
      testimonialText: testimonialText.trim(),
      profilePhoto: req.file ? req.file.path : null
    });

    await testimonial.populate('userId', 'name email');

    res.status(201).json({
      message: 'Testimonial submitted successfully! It will be visible after admin approval.',
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all approved testimonials (public)
exports.getTestimonials = async (req, res) => {
  try {
    const { rating, page = 1, limit = 10 } = req.query;
    
    const query = { isApproved: true };
    if (rating) {
      query.rating = parseInt(rating);
    }

    const testimonials = await Testimonial.find(query)
      .populate('userId', 'name')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Testimonial.countDocuments(query);

    res.json({
      testimonials,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get featured testimonials (public - for homepage)
exports.getFeaturedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ 
      isApproved: true, 
      isFeatured: true 
    })
      .populate('userId', 'name')
      .sort({ rating: -1, createdAt: -1 })
      .limit(3);

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update own testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, testimonialText } = req.body;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    if (testimonial.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own testimonial' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (testimonialText && testimonialText.length > 500) {
      return res.status(400).json({ message: 'Testimonial text must be 500 characters or less' });
    }

    if (rating) testimonial.rating = rating;
    if (testimonialText) testimonial.testimonialText = testimonialText.trim();
    if (req.file) testimonial.profilePhoto = req.file.path;

    // Reset approval status when edited
    testimonial.isApproved = false;
    testimonial.approvedBy = null;
    testimonial.approvedAt = null;

    await testimonial.save();
    await testimonial.populate('userId', 'name email');

    res.json({
      message: 'Testimonial updated successfully! It will be reviewed again by admin.',
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete own testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    if (testimonial.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own testimonial' });
    }

    await Testimonial.findByIdAndDelete(id);

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all testimonials (admin only)
exports.getAllTestimonials = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    }

    const testimonials = await Testimonial.find(query)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Testimonial.countDocuments(query);
    const pendingCount = await Testimonial.countDocuments({ isApproved: false });
    const approvedCount = await Testimonial.countDocuments({ isApproved: true });

    res.json({
      testimonials,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
      pendingCount,
      approvedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/reject testimonial (admin only)
exports.approveTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { approve } = req.body;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    if (approve) {
      testimonial.isApproved = true;
      testimonial.approvedBy = req.user._id;
      testimonial.approvedAt = new Date();
    } else {
      // Reject = delete
      await Testimonial.findByIdAndDelete(id);
      return res.json({ message: 'Testimonial rejected and deleted' });
    }

    await testimonial.save();
    await testimonial.populate('userId', 'name email');
    await testimonial.populate('approvedBy', 'name');

    res.json({
      message: 'Testimonial approved successfully',
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle featured status (admin only)
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    if (!testimonial.isApproved) {
      return res.status(400).json({ message: 'Only approved testimonials can be featured' });
    }

    testimonial.isFeatured = !testimonial.isFeatured;
    await testimonial.save();
    await testimonial.populate('userId', 'name email');

    res.json({
      message: `Testimonial ${testimonial.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete testimonial (admin only)
exports.deleteTestimonialAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    await Testimonial.findByIdAndDelete(id);

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
