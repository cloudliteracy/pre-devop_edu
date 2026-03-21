const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/initiate', auth, paymentController.initiatePayment);
router.get('/verify/:paymentId', auth, paymentController.verifyPayment);
router.post('/verify-stripe', auth, paymentController.verifyStripePayment);

module.exports = router;
