const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');
const verifyAccess = require('../middleware/verifyAccess');

router.get('/:moduleId', auth, verifyAccess, quizController.getQuiz);
router.post('/:moduleId/submit', auth, verifyAccess, quizController.submitQuiz);

module.exports = router;
