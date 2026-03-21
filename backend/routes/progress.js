const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

router.post('/track', auth, progressController.trackProgress);
router.get('/:moduleId', auth, progressController.getProgress);
router.put('/:moduleId/quiz', auth, progressController.updateQuizProgress);

module.exports = router;
