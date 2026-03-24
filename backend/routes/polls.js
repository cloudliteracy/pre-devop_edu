const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pollController = require('../controllers/pollController');
const auth = require('../middleware/auth');

// Configure multer for survey file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/survey-responses/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'survey-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|mp4|avi|mov|wmv|flv|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and video files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

router.get('/', pollController.getPolls);
router.post('/', auth, pollController.createPoll);
router.put('/:id', auth, pollController.updatePoll);
router.post('/:id/vote', auth, upload.array('files', 10), pollController.votePoll);
router.delete('/:id', auth, pollController.deletePoll);

module.exports = router;
