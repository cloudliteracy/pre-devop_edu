const Payment = require('../models/Payment');
const User = require('../models/User');
const Module = require('../models/Module');
const ReferralCode = require('../models/ReferralCode');
const Referral = require('../models/Referral');
const AffiliatePartner = require('../models/AffiliatePartner');
const Coupon = require('../models/Coupon');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const mtnMomoService = require('../services/mtnMomoService');
const orangeMoneyService = require('../services/orangeMoneyService');
const { generatePartnerAccessCode } = require('../utils/partnerCodeGenerator');
const { sendPartnerWelcomeEmail } = require('../services/emailService');

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
    const { moduleId, paymentMethod, phoneNumber, amount, isDonation, isPartnerPurchase, partnerTier } = req.body;
    const userId = req.user._id;

    let paymentAmount;
    let itemDescription;

    if (isPartnerPurchase) {
      if (!['Silver', 'Gold', 'Platinum', 'Diamond'].includes(partnerTier)) {
         return res.status(400).json({ message: 'Invalid partner tier' });
      }
      const tierPrices = { Silver: 500, Gold: 1000, Platinum: 2000, Diamond: 5000 };
      paymentAmount = tierPrices[partnerTier];
      itemDescription = `${partnerTier} Partner Package`;
    } else if (isDonation) {
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
      moduleId: isDonation || isPartnerPurchase ? null : moduleId,
      isPartnerPurchase: isPartnerPurchase || false,
      partnerTier: isPartnerPurchase ? partnerTier : undefined,
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
    const { sessionId, referralCode } = req.body;
    const userId = req.user._id;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const payment = await Payment.findOne({ transactionId: sessionId });

      if (payment) {
        payment.status = 'completed';
        await payment.save();

        // Process referral if code provided
        await processReferral(userId, payment.amount, referralCode);

        if (payment.isPartnerPurchase) {
          const accessCode = generatePartnerAccessCode(payment.partnerTier);
          const targetUser = await User.findById(userId);
          const newRole = (targetUser.role === 'admin' || targetUser.isSuperAdmin) ? 'admin' : 'partner';
          
          await User.findByIdAndUpdate(userId, {
            $set: { 
              role: newRole, 
              partnerTier: payment.partnerTier,
              partnerAccessCode: accessCode,
              isCsrUser: true 
            }
          });

          // Send welcome email with access code
          try {
            await sendPartnerWelcomeEmail(
              targetUser.email,
              targetUser.name,
              payment.partnerTier,
              accessCode
            );
          } catch (emailError) {
            console.error('Failed to send partner welcome email:', emailError);
          }
        } else if (payment.moduleId) {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { purchasedModules: payment.moduleId }
          });
        }

        return res.json({
          success: true,
          message: 'Payment verified successfully',
          moduleId: payment.moduleId,
          isDonation: !payment.moduleId && !payment.isPartnerPurchase,
          isPartnerPurchase: payment.isPartnerPurchase
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
    const { orderId, referralCode } = req.body;
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

        // Process referral if code provided
        await processReferral(userId, payment.amount, referralCode);

        if (payment.isPartnerPurchase) {
          const accessCode = generatePartnerAccessCode(payment.partnerTier);
          const targetUser = await User.findById(userId);
          
          await User.findByIdAndUpdate(userId, {
            $set: { 
              role: 'partner', 
              partnerTier: payment.partnerTier,
              partnerAccessCode: accessCode,
              isCsrUser: true 
            }
          });

          // Send welcome email with access code
          try {
            await sendPartnerWelcomeEmail(
              targetUser.email,
              targetUser.name,
              payment.partnerTier,
              accessCode
            );
          } catch (emailError) {
            console.error('Failed to send partner welcome email:', emailError);
          }
        } else if (payment.moduleId) {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { purchasedModules: payment.moduleId }
          });
        }

        return res.json({
          success: true,
          message: 'Payment verified successfully',
          moduleId: payment.moduleId,
          isDonation: !payment.moduleId && !payment.isPartnerPurchase,
          isPartnerPurchase: payment.isPartnerPurchase
        });
      }
    }

    res.status(400).json({ success: false, message: 'Payment not completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

// Test endpoint to simulate MTN MoMo / Orange Money payment completion
exports.completeMobileMoneyPayment = async (req, res) => {
  try {
    const { paymentId, referralCode } = req.body;
    const userId = req.user._id;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    // Simulate successful payment
    payment.status = 'completed';
    await payment.save();

    // Process referral if code provided
    await processReferral(userId, payment.amount, referralCode);

    if (payment.isPartnerPurchase) {
      const accessCode = generatePartnerAccessCode(payment.partnerTier);
      const targetUser = await User.findById(userId);
      const newRole = (targetUser.role === 'admin' || targetUser.isSuperAdmin) ? 'admin' : 'partner';
      
      await User.findByIdAndUpdate(userId, {
        $set: { 
          role: newRole, 
          partnerTier: payment.partnerTier,
          partnerAccessCode: accessCode,
          isCsrUser: true 
        }
      });

      // Send welcome email with access code
      try {
        await sendPartnerWelcomeEmail(
          targetUser.email,
          targetUser.name,
          payment.partnerTier,
          accessCode
        );
      } catch (emailError) {
        console.error('Failed to send partner welcome email:', emailError);
      }
    } else if (payment.moduleId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedModules: payment.moduleId }
      });
    }

    res.json({
      success: true,
      message: 'Mobile money payment completed successfully',
      moduleId: payment.moduleId,
      isDonation: !payment.moduleId && !payment.isPartnerPurchase,
      isPartnerPurchase: payment.isPartnerPurchase
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment completion failed', error: error.message });
  }
};

// Check MTN MoMo transaction status
exports.checkMTNMoMoStatus = async (req, res) => {
  try {
    const { referenceId } = req.params;
    const userId = req.user._id;

    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: referenceId });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Query MTN MoMo for transaction status
    const result = await mtnMomoService.getTransactionStatus(referenceId);

    if (result.success && result.status === 'SUCCESSFUL') {
      payment.status = 'completed';
      await payment.save();

      if (payment.isPartnerPurchase) {
        const accessCode = generatePartnerAccessCode(payment.partnerTier);
        const targetUser = await User.findById(userId);
        const newRole = (targetUser.role === 'admin' || targetUser.isSuperAdmin) ? 'admin' : 'partner';
        
        await User.findByIdAndUpdate(userId, {
          $set: { 
            role: newRole, 
            partnerTier: payment.partnerTier,
            partnerAccessCode: accessCode,
            isCsrUser: true 
          }
        });

        // Send welcome email with access code
        try {
          await sendPartnerWelcomeEmail(
            targetUser.email,
            targetUser.name,
            payment.partnerTier,
            accessCode
          );
        } catch (emailError) {
          console.error('Failed to send partner welcome email:', emailError);
        }
      } else if (payment.moduleId) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { purchasedModules: payment.moduleId }
        });
      }

      return res.json({
        success: true,
        status: 'SUCCESSFUL',
        message: 'Payment completed successfully',
        transactionDetails: result,
        moduleId: payment.moduleId,
        isDonation: !payment.moduleId && !payment.isPartnerPurchase,
        isPartnerPurchase: payment.isPartnerPurchase
      });
    } else if (result.success && result.status === 'FAILED') {
      payment.status = 'failed';
      await payment.save();

      return res.json({
        success: false,
        status: 'FAILED',
        message: 'Payment failed',
        reason: result.reason,
        transactionDetails: result
      });
    } else {
      // Still pending
      return res.json({
        success: true,
        status: result.status || 'PENDING',
        message: 'Payment is still pending',
        transactionDetails: result
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check transaction status', 
      error: error.message 
    });
  }
};

// Check Orange Money transaction status
exports.checkOrangeMoneyStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: orderId });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Query Orange Money for transaction status
    const result = await orangeMoneyService.getTransactionStatus(orderId);

    if (result.success && result.status === 'SUCCESSFUL') {
      payment.status = 'completed';
      await payment.save();

      if (payment.isPartnerPurchase) {
        const accessCode = generatePartnerAccessCode(payment.partnerTier);
        const targetUser = await User.findById(userId);
        const newRole = (targetUser.role === 'admin' || targetUser.isSuperAdmin) ? 'admin' : 'partner';
        
        await User.findByIdAndUpdate(userId, {
          $set: { 
            role: newRole, 
            partnerTier: payment.partnerTier,
            partnerAccessCode: accessCode,
            isCsrUser: true 
          }
        });

        // Send welcome email with access code
        try {
          await sendPartnerWelcomeEmail(
            targetUser.email,
            targetUser.name,
            payment.partnerTier,
            accessCode
          );
        } catch (emailError) {
          console.error('Failed to send partner welcome email:', emailError);
        }
      } else if (payment.moduleId) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { purchasedModules: payment.moduleId }
        });
      }

      return res.json({
        success: true,
        status: 'SUCCESSFUL',
        message: 'Payment completed successfully',
        transactionDetails: result,
        moduleId: payment.moduleId,
        isDonation: !payment.moduleId && !payment.isPartnerPurchase,
        isPartnerPurchase: payment.isPartnerPurchase
      });
    } else if (result.success && result.status === 'FAILED') {
      payment.status = 'failed';
      await payment.save();

      return res.json({
        success: false,
        status: 'FAILED',
        message: 'Payment failed',
        transactionDetails: result
      });
    } else {
      // Still pending
      return res.json({
        success: true,
        status: result.status || 'PENDING',
        message: 'Payment is still pending',
        transactionDetails: result
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check transaction status', 
      error: error.message 
    });
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
  try {
    // Initiate MTN MoMo request-to-pay
    const result = await mtnMomoService.requestToPay({
      amount: amount,
      currency: process.env.MTN_MOMO_CURRENCY || 'EUR', // EUR for sandbox, XAF for Cameroon production
      phoneNumber: phoneNumber,
      payerMessage: description,
      payeeNote: `CloudLiteracy - ${description}`,
      externalId: payment._id.toString()
    });

    if (result.success) {
      payment.status = 'pending';
      payment.transactionId = result.referenceId;
      
      return {
        success: true,
        message: 'MTN MoMo payment initiated. Please approve the transaction on your phone.',
        paymentId: payment._id,
        referenceId: result.referenceId,
        instructions: [
          '1. Check your phone for MTN MoMo payment prompt',
          '2. Enter your PIN to approve the payment',
          '3. You will be redirected automatically upon completion'
        ]
      };
    } else {
      payment.status = 'failed';
      throw new Error(result.message);
    }
  } catch (error) {
    payment.status = 'failed';
    console.error('MTN MoMo payment error:', error.message);
    
    // Fallback to test mode if service is not configured
    if (error.message.includes('Missing required MTN MoMo credentials')) {
      payment.status = 'pending';
      payment.transactionId = 'MTN-TEST-' + Date.now();
      
      return { 
        message: 'MTN MoMo payment initiated (TEST MODE). Use the test completion endpoint to simulate payment.',
        paymentId: payment._id,
        transactionId: payment.transactionId,
        testUrl: `${process.env.FRONTEND_URL}/payment/momo-test?paymentId=${payment._id}`,
        isTestMode: true
      };
    }
    
    throw error;
  }
}

async function handleOrangeMoney(description, amount, payment, phoneNumber) {
  try {
    // Initiate Orange Money payment
    const result = await orangeMoneyService.initiatePayment({
      amount: amount,
      currency: process.env.ORANGE_MONEY_CURRENCY || 'XAF',
      phoneNumber: phoneNumber,
      description: description,
      reference: payment._id.toString()
    });

    if (result.success) {
      payment.status = 'pending';
      payment.transactionId = result.orderId;
      
      return {
        success: true,
        message: 'Orange Money payment initiated. You will be redirected to complete the payment.',
        paymentId: payment._id,
        orderId: result.orderId,
        paymentUrl: result.paymentUrl,
        url: result.paymentUrl // For automatic redirect
      };
    } else {
      payment.status = 'failed';
      throw new Error(result.message);
    }
  } catch (error) {
    payment.status = 'failed';
    console.error('Orange Money payment error:', error.message);
    
    // Fallback to test mode if service is not configured
    if (error.message.includes('Missing required Orange Money credentials')) {
      payment.status = 'pending';
      payment.transactionId = 'OM-TEST-' + Date.now();
      
      return { 
        message: 'Orange Money payment initiated (TEST MODE). Use the test completion endpoint to simulate payment.',
        paymentId: payment._id,
        transactionId: payment.transactionId,
        testUrl: `${process.env.FRONTEND_URL}/payment/momo-test?paymentId=${payment._id}`,
        isTestMode: true
      };
    }
    
    throw error;
  }
}

// Process referral rewards after successful payment
async function processReferral(userId, paymentAmount, referralCode) {
  try {
    if (!referralCode) return;

    const referralCodeDoc = await ReferralCode.findOne({ 
      code: referralCode.toUpperCase(), 
      isActive: true 
    });
    
    if (!referralCodeDoc) return;

    // Don't allow self-referral
    if (referralCodeDoc.userId.toString() === userId.toString()) return;

    // Check if referral already exists (prevent duplicates)
    const existingReferral = await Referral.findOne({
      referrerId: referralCodeDoc.userId,
      referredUserId: userId,
      referralCode: referralCode.toUpperCase()
    });

    if (existingReferral) {
      console.log(`Referral already processed: ${referralCode} -> User ${userId}`);
      return; // Skip if already processed
    }

    // Create referral record
    await Referral.create({
      referrerId: referralCodeDoc.userId,
      referredUserId: userId,
      referralCode: referralCode.toUpperCase(),
      status: 'completed',
      rewardType: 'discount',
      rewardAmount: paymentAmount * 0.10, // 10% discount value
      conversionDate: new Date()
    });

    // Update referral code stats
    referralCodeDoc.conversions += 1;
    referralCodeDoc.revenue += paymentAmount;
    await referralCodeDoc.save();

    // Check if referrer is affiliate
    const affiliate = await AffiliatePartner.findOne({ 
      userId: referralCodeDoc.userId, 
      isApproved: true 
    });
    
    if (affiliate) {
      // Affiliate gets commission
      const commission = paymentAmount * (affiliate.commissionRate / 100);
      affiliate.pendingEarnings += commission;
      affiliate.totalEarnings += commission;
      await affiliate.save();
    } else {
      // Regular referrer gets 20% discount coupon for next purchase
      const couponCode = `REF${Date.now().toString().slice(-6)}`;
      await Coupon.create({
        userId: referralCodeDoc.userId,
        code: couponCode,
        discountPercent: 20,
        discountAmount: 0,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      });
    }

    console.log(`Referral processed: ${referralCode} -> User ${userId}`);
  } catch (error) {
    console.error('Error processing referral:', error);
    // Don't throw error - referral processing shouldn't block payment
  }
}
