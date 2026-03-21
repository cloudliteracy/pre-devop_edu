const Payment = require('../models/Payment');
const User = require('../models/User');
const Module = require('../models/Module');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

exports.initiatePayment = async (req, res) => {
  try {
    const { moduleId, paymentMethod, phoneNumber } = req.body;
    const userId = req.user._id;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const payment = new Payment({
      userId,
      moduleId,
      amount: module.price,
      paymentMethod,
      phoneNumber
    });

    let paymentResponse;

    switch (paymentMethod) {
      case 'stripe':
        paymentResponse = await handleStripePayment(module, payment);
        break;
      case 'paypal':
        paymentResponse = await handlePayPalPayment(module, payment);
        break;
      case 'mtn_momo':
        paymentResponse = await handleMTNMoMo(module, payment, phoneNumber);
        break;
      case 'orange_money':
        paymentResponse = await handleOrangeMoney(module, payment, phoneNumber);
        break;
      default:
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    await payment.save();
    res.json(paymentResponse);
  } catch (error) {
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'completed') {
      await User.findByIdAndUpdate(payment.userId, {
        $addToSet: { purchasedModules: payment.moduleId }
      });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

async function handleStripePayment(module, payment) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'xaf',
        product_data: { name: module.title },
        unit_amount: module.price * 100
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
  });

  payment.transactionId = session.id;
  return { sessionId: session.id, url: session.url };
}

async function handlePayPalPayment(module, payment) {
  return { message: 'PayPal integration pending', paymentId: payment._id };
}

async function handleMTNMoMo(module, payment, phoneNumber) {
  return { message: 'MTN MoMo integration pending', paymentId: payment._id };
}

async function handleOrangeMoney(module, payment, phoneNumber) {
  return { message: 'Orange Money integration pending', paymentId: payment._id };
}
