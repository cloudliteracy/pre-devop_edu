const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const ReferralCode = require('../models/ReferralCode');
const Referral = require('../models/Referral');
const AffiliatePartner = require('../models/AffiliatePartner');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

// Generate or get user's referral code
router.post('/generate-code', auth, async (req, res) => {
  try {
    let referralCode = await ReferralCode.findOne({ userId: req.user._id });

    if (referralCode) {
      return res.json({ code: referralCode.code, message: 'You already have a referral code' });
    }

    // Generate unique code based on user's name
    const generateCode = () => {
      const name = req.user.name.split(' ')[0].toUpperCase().substring(0, 6);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${name}-${random}`;
    };

    let code = generateCode();
    let exists = await ReferralCode.findOne({ code });

    while (exists) {
      code = generateCode();
      exists = await ReferralCode.findOne({ code });
    }

    referralCode = await ReferralCode.create({
      userId: req.user._id,
      code
    });

    res.json({ code: referralCode.code, message: 'Referral code generated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate referral code', error: error.message });
  }
});

// Get user's referral code
router.get('/my-code', auth, async (req, res) => {
  try {
    const referralCode = await ReferralCode.findOne({ userId: req.user._id });
    
    if (!referralCode) {
      return res.status(404).json({ message: 'No referral code found. Generate one first.' });
    }

    res.json(referralCode);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch referral code', error: error.message });
  }
});

// Get referral statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const referralCode = await ReferralCode.findOne({ userId: req.user._id });
    
    if (!referralCode) {
      return res.json({ clicks: 0, conversions: 0, revenue: 0, referrals: [] });
    }

    const referrals = await Referral.find({ referrerId: req.user._id })
      .populate('referredUserId', 'name email createdAt')
      .sort({ createdAt: -1 });

    const affiliate = await AffiliatePartner.findOne({ userId: req.user._id });

    res.json({
      code: referralCode.code,
      clicks: referralCode.clicks,
      conversions: referralCode.conversions,
      revenue: referralCode.revenue,
      referrals,
      isAffiliate: !!affiliate,
      affiliateEarnings: affiliate ? {
        total: affiliate.totalEarnings,
        pending: affiliate.pendingEarnings,
        paid: affiliate.paidEarnings
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Track referral click
router.post('/track-click/:code', async (req, res) => {
  try {
    const referralCode = await ReferralCode.findOne({ code: req.params.code.toUpperCase(), isActive: true });
    
    if (!referralCode) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    referralCode.clicks += 1;
    await referralCode.save();

    res.json({ message: 'Click tracked', code: referralCode.code });
  } catch (error) {
    res.status(500).json({ message: 'Failed to track click', error: error.message });
  }
});

// Validate referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const referralCode = await ReferralCode.findOne({ 
      code: req.params.code.toUpperCase(), 
      isActive: true 
    }).populate('userId', 'name');

    if (!referralCode) {
      return res.status(404).json({ valid: false, message: 'Invalid or inactive referral code' });
    }

    res.json({ 
      valid: true, 
      code: referralCode.code,
      referrerName: referralCode.userId.name,
      discount: 10 // 10% discount for referred users
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate code', error: error.message });
  }
});

// Get user's coupons
router.get('/my-coupons', auth, async (req, res) => {
  try {
    const coupons = await Coupon.find({ 
      userId: req.user._id,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coupons', error: error.message });
  }
});

// Gift coupon to another user
router.post('/gift-coupon', auth, async (req, res) => {
  try {
    const { couponId, recipientEmail } = req.body;

    // Validate input
    if (!couponId || !recipientEmail) {
      return res.status(400).json({ message: 'Coupon ID and recipient email are required' });
    }

    // Find the coupon
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Verify ownership
    if (coupon.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not own this coupon' });
    }

    // Check if already used
    if (coupon.isUsed) {
      return res.status(400).json({ message: 'This coupon has already been used' });
    }

    // Check if already gifted
    if (coupon.isGifted) {
      return res.status(400).json({ message: 'This coupon has already been gifted' });
    }

    // Check if expired
    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    // Find recipient user
    const recipient = await User.findOne({ email: recipientEmail.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found. They must have an account.' });
    }

    // Prevent gifting to self
    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot gift a coupon to yourself' });
    }

    // Transfer coupon
    coupon.giftedFrom = req.user._id;
    coupon.giftedTo = recipient._id;
    coupon.userId = recipient._id;
    coupon.isGifted = true;
    coupon.giftedAt = new Date();
    await coupon.save();

    res.json({ 
      message: `Coupon ${coupon.code} successfully gifted to ${recipient.name}!`,
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        recipientName: recipient.name,
        recipientEmail: recipient.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to gift coupon', error: error.message });
  }
});

// Apply coupon to payment
router.post('/apply-coupon', auth, async (req, res) => {
  try {
    const { code, amount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      userId: req.user._id,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    let discount = 0;
    if (coupon.discountPercent > 0) {
      discount = (amount * coupon.discountPercent) / 100;
    } else if (coupon.discountAmount > 0) {
      discount = coupon.discountAmount;
    }

    const finalAmount = Math.max(0, amount - discount);

    res.json({
      valid: true,
      discount,
      finalAmount,
      couponCode: coupon.code
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply coupon', error: error.message });
  }
});

// ============ AFFILIATE PROGRAM ============

// Apply to become affiliate
router.post('/affiliate/apply', auth, async (req, res) => {
  try {
    const { paymentMethod, paymentDetails, applicationMessage } = req.body;

    const existing = await AffiliatePartner.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for the affiliate program' });
    }

    const affiliate = await AffiliatePartner.create({
      userId: req.user._id,
      paymentMethod,
      paymentDetails,
      applicationMessage
    });

    res.json({ message: 'Affiliate application submitted successfully. We will review and get back to you.', affiliate });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
});

// Get affiliate dashboard
router.get('/affiliate/dashboard', auth, async (req, res) => {
  try {
    const affiliate = await AffiliatePartner.findOne({ userId: req.user._id });
    
    if (!affiliate) {
      return res.status(404).json({ message: 'You are not an affiliate partner' });
    }

    const referralCode = await ReferralCode.findOne({ userId: req.user._id });
    const referrals = await Referral.find({ referrerId: req.user._id, status: 'completed' })
      .populate('referredUserId', 'name email')
      .sort({ conversionDate: -1 });

    res.json({
      affiliate,
      referralCode,
      referrals,
      canRequestPayout: affiliate.pendingEarnings >= affiliate.minimumPayout
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard', error: error.message });
  }
});

// Request payout
router.post('/affiliate/request-payout', auth, async (req, res) => {
  try {
    const affiliate = await AffiliatePartner.findOne({ userId: req.user._id, isApproved: true });
    
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate account not found or not approved' });
    }

    if (affiliate.pendingEarnings < affiliate.minimumPayout) {
      return res.status(400).json({ 
        message: `Minimum payout is $${affiliate.minimumPayout}. Your pending earnings: $${affiliate.pendingEarnings}` 
      });
    }

    // In production, integrate with payment gateway
    // For now, just notify admin
    const admin = await User.findOne({ isPrimarySuperAdmin: true });
    
    // TODO: Send email to admin about payout request

    res.json({ 
      message: 'Payout request submitted. Admin will process it within 5-7 business days.',
      amount: affiliate.pendingEarnings
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request payout', error: error.message });
  }
});

// ============ ADMIN ROUTES ============

// Get all affiliate applications
router.get('/admin/affiliates', adminAuth, async (req, res) => {
  try {
    const affiliates = await AffiliatePartner.find()
      .populate('userId', 'name email country')
      .populate('approvedBy', 'name')
      .sort({ appliedAt: -1 });

    res.json(affiliates);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch affiliates', error: error.message });
  }
});

// Approve/reject affiliate
router.put('/admin/affiliates/:id/approve', adminAuth, async (req, res) => {
  try {
    const { approved } = req.body;
    const affiliate = await AffiliatePartner.findById(req.params.id);

    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    affiliate.isApproved = approved;
    if (approved) {
      affiliate.approvedAt = new Date();
      affiliate.approvedBy = req.user._id;
    }
    await affiliate.save();

    // TODO: Send email notification to user

    res.json({ message: `Affiliate ${approved ? 'approved' : 'rejected'}`, affiliate });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update affiliate', error: error.message });
  }
});

// Process payout
router.post('/admin/affiliates/:id/payout', adminAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const affiliate = await AffiliatePartner.findById(req.params.id);

    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    if (amount > affiliate.pendingEarnings) {
      return res.status(400).json({ message: 'Payout amount exceeds pending earnings' });
    }

    affiliate.pendingEarnings -= amount;
    affiliate.paidEarnings += amount;
    await affiliate.save();

    // Update referrals to mark as paid
    await Referral.updateMany(
      { referrerId: affiliate.userId, paidOut: false },
      { paidOut: true }
    );

    // TODO: Process actual payment via PayPal/Bank/MoMo

    res.json({ message: 'Payout processed successfully', affiliate });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process payout', error: error.message });
  }
});

module.exports = router;
