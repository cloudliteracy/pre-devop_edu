const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const aiQRController = require('../controllers/aiQRController');
const auth = require('../middleware/auth');
const superAdminOnlyAI = require('../middleware/superAdminOnlyAI');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ai-knowledge/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'KB-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only accept PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// All routes require authentication and super admin access
router.use(auth);
router.use(superAdminOnlyAI);

// Chat endpoints
router.post('/chat/send', aiQRController.sendMessage);
router.get('/chat/conversation', aiQRController.getConversation);
router.delete('/chat/conversation', aiQRController.clearConversation);
router.post('/chat/mark-read', aiQRController.markAsRead);

// Knowledge base document management
router.post('/documents/upload', upload.single('document'), aiQRController.uploadDocument);
router.get('/documents', aiQRController.getDocuments);
router.get('/documents/:id/download', aiQRController.downloadDocument);
router.delete('/documents/:id', aiQRController.deleteDocument);

// Knowledge base refresh (manual trigger)
router.post('/knowledge/refresh', aiQRController.refreshKnowledge);
router.get('/knowledge/stats', aiQRController.getStats);

module.exports = router;
