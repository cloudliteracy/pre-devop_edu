const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const auth = require('../middleware/auth');

router.get('/', pollController.getPolls);
router.post('/', auth, pollController.createPoll);
router.post('/:id/vote', auth, pollController.votePoll);
router.delete('/:id', auth, pollController.deletePoll);

module.exports = router;
