const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: false, default: null },
  isPartnerPurchase: { type: Boolean, default: false },
  partnerTier: { type: String, enum: ['Silver', 'Gold', 'Platinum', 'Diamond'] },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: { 
    type: String, 
    enum: ['mtn_momo', 'orange_money', 'stripe', 'paypal'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  phoneNumber: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
