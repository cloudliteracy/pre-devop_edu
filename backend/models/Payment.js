const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XAF' },
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
