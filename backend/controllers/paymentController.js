const Payment = require('../models/Payment');
const User = require('../models/User');
const Module = require('../models/Module');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data.access_token;
};

exports.initiatePayment = async (req, res) => {
  try {
    const { moduleId, paymentMethod, phoneNumber, amount, isDonation } = req.body;
    const userId = req.user._id;

    let paymentAmount;
    let itemDescription;

    if (isDonation) {
      // Handle donation
      paymentAmount = amount;
      itemDescription = 'Donation to CloudLiteracy';
    } else {
      // Handle module purchase
      const module = await Module.findById(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }
      paymentAmount = module.price;
      itemDescription = module.title;
    }

    const payment = new Payment({
      userId,
      moduleId: isDonation ? null : moduleId,
      amount: paymentAmount,
      paymentMethod,
      phoneNumber
    });

    let paymentResponse;

    switch (paymentMethod) {
      case 'stripe':
        paymentResponse = await handleStripePayment(itemDescription, paymentAmount, payment, isDonation);
        break;
      case 'paypal':
        paymentResponse = await handlePayPalPayment(itemDescription, paymentAmount, payment, isDonation);
        break;
      case 'mtn_momo':
        paymentResponse = await handleMTNMoMo(itemDescription, paymentAmount, payment, phoneNumber);
        break;
      case 'orange_money':
        paymentResponse = await handleOrangeMoney(itemDescription, paymentAmount, payment, phoneNumber);
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

exports.verifyStripePayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const payment = await Payment.findOne({ transactionId: sessionId });

      if (payment) {
        payment.status = 'completed';
        await payment.save();

        // Only grant module access if it's not a donation
        if (payment.moduleId) {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { purchasedModules: payment.moduleId }
          });
        }

        return res.json({
          success: true,
          message: 'Payment verified successfully',
          moduleId: payment.moduleId,
          isDonation: !payment.moduleId
        });
      }
    }

    res.status(400).json({ success: false, message: 'Payment not completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

exports.verifyPayPalPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user._id;

    const accessToken = await getPayPalAccessToken();
    
    const captureResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    if (captureResponse.data.status === 'COMPLETED') {
      const payment = await Payment.findOne({ transactionId: orderId });

      if (payment) {
        payment.status = 'completed';
        await payment.save();

        // Only grant module access if it's not a donation
        if (payment.moduleId) {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { purchasedModules: payment.moduleId }
          });
        }

        return res.json({
          success: true,
          message: 'Payment verified successfully',
          moduleId: payment.moduleId,
          isDonation: !payment.moduleId
        });
      }
    }

    res.status(400).json({ success: false, message: 'Payment not completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

async function handleStripePayment(description, amount, payment, isDonation) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: description },
        unit_amount: Math.round(amount * 100)
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

async function handlePayPalPayment(description, amount, payment, isDonation) {
  const accessToken = await getPayPalAccessToken();
  
  const order = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount.toFixed(2)
      },
      description: description
    }],
    application_context: {
      brand_name: 'CloudLiteracy',
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      user_action: 'PAY_NOW'
    }
  }, {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  payment.transactionId = order.data.id;
  const approveLink = order.data.links.find(link => link.rel === 'approve');
  return { orderId: order.data.id, url: approveLink.href };
}

async function handleMTNMoMo(description, amount, payment, phoneNumber) {
  return { message: 'MTN MoMo integration pending', paymentId: payment._id };
}

async function handleOrangeMoney(description, amount, payment, phoneNumber) {
  return { message: 'Orange Money integration pending', paymentId: payment._id };
}
