const express = require('express');
const router = express.Router();
const helpdeskController = require('../controllers/helpdeskController');
const { optionalAuth } = require('../middleware/auth');
const auth = require('../middleware/auth');

// Public/authenticated routes
router.post('/session', optionalAuth, helpdeskController.createSession);
router.get('/session/:sessionId', optionalAuth, helpdeskController.getSession);
router.post('/session/:sessionId/message/guest', optionalAuth, helpdeskController.sendMessage);
router.post('/session/:sessionId/message', auth, helpdeskController.sendMessage);

// Admin routes
router.post('/session/:sessionId/join', auth, helpdeskController.joinChat);
router.post('/session/:sessionId/close', auth, helpdeskController.closeSession);
router.get('/sessions/active', auth, helpdeskController.getActiveSessions);
router.get('/sessions/history', auth, helpdeskController.getChatHistory);
router.delete('/session/:sessionId', auth, helpdeskController.deleteSession);

module.exports = router;
