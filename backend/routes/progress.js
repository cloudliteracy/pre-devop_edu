const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

router.post('/track', auth, progressController.trackProgress);
router.get('/:moduleId', auth, progressController.getProgress);
router.put('/:moduleId/quiz', auth, progressController.updateQuizProgress);
router.post('/:moduleId/video-complete', auth, progressController.markVideoComplete);
router.post('/:moduleId/markdown-viewed', auth, progressController.markMarkdownViewed);

module.exports = router;
