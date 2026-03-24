const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const testimonialController = require('../controllers/testimonialController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/testimonials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Public routes
router.get('/', testimonialController.getTestimonials);
router.get('/featured', testimonialController.getFeaturedTestimonials);

// Authenticated routes
router.post('/', auth, upload.single('profilePhoto'), testimonialController.createTestimonial);
router.put('/:id', auth, upload.single('profilePhoto'), testimonialController.updateTestimonial);
router.delete('/:id', auth, testimonialController.deleteTestimonial);

// Admin routes
router.get('/admin/all', auth, adminAuth, testimonialController.getAllTestimonials);
router.put('/admin/:id/approve', auth, adminAuth, testimonialController.approveTestimonial);
router.put('/admin/:id/toggle-featured', auth, adminAuth, testimonialController.toggleFeatured);
router.delete('/admin/:id', auth, adminAuth, testimonialController.deleteTestimonialAdmin);

module.exports = router;
