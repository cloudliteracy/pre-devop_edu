const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');
const upload = require('../config/upload');

// Get all comments (public)
router.get('/', commentController.getComments);

// Create new comment (auth required) - supports up to 5 files
router.post('/', auth, upload.array('files', 5), commentController.createComment);

// Reply to comment (auth required) - supports up to 5 files
router.post('/:id/reply', auth, upload.array('files', 5), commentController.replyToComment);

// Edit own comment (auth required)
router.put('/:id', auth, commentController.editComment);

// Delete comment (auth required - own or admin)
router.delete('/:id', auth, commentController.deleteComment);

// Add reaction to comment (auth required)
router.post('/:id/reaction', auth, commentController.addReaction);

// Remove reaction from comment (auth required)
router.delete('/:id/reaction', auth, commentController.removeReaction);

// Get chat settings
router.get('/settings/status', commentController.getChatSettings);

// Toggle chat enabled/disabled (admin only)
router.post('/settings/toggle', auth, commentController.toggleChat);

module.exports = router;
