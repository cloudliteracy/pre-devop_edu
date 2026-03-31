const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('./models/Payment');
const User = require('./models/User');

async function investigatePartnerData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check all completed payments
    const allPayments = await Payment.find({ status: 'completed' })
      .populate('userId', 'name email role partnerTier partnerAccessCode')
      .sort({ createdAt: -1 });

    console.log('=== ALL COMPLETED PAYMENTS ===\n');
    console.log(`Total Payments: ${allPayments.length}`);
    
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    console.log(`Total Revenue: $${totalRevenue.toFixed(2)}\n`);

    // Separate partner purchases
    const partnerPurchases = allPayments.filter(p => p.isPartnerPurchase);
    console.log(`Partner Package Purchases: ${partnerPurchases.length}`);
    
    if (partnerPurchases.length > 0) {
      const partnerRevenue = partnerPurchases.reduce((sum, p) => sum + p.amount, 0);
      console.log(`Partner Revenue: $${partnerRevenue.toFixed(2)}\n`);
      
      console.log('=== PARTNER PURCHASE DETAILS ===\n');
      partnerPurchases.forEach(payment => {
        console.log(`Date: ${payment.createdAt.toLocaleString()}`);
        console.log(`User: ${payment.userId?.name || 'DELETED'} (${payment.userId?.email || 'N/A'})`);
        console.log(`Tier: ${payment.partnerTier}`);
        console.log(`Amount: $${payment.amount}`);
        console.log(`Payment Method: ${payment.paymentMethod}`);
        console.log(`User Current Role: ${payment.userId?.role || 'USER DELETED'}`);
        console.log(`User Partner Tier: ${payment.userId?.partnerTier || 'NONE'}`);
        console.log(`Access Code: ${payment.userId?.partnerAccessCode || 'NONE'}`);
        console.log('---\n');
      });
    }

    // Check all users with partner-related data
    console.log('=== CHECKING ALL USERS FOR PARTNER DATA ===\n');
    
    const usersWithPartnerRole = await User.find({ role: 'partner' })
      .select('name email role partnerTier partnerAccessCode createdAt');
    console.log(`Users with role='partner': ${usersWithPartnerRole.length}`);
    
    const usersWithPartnerTier = await User.find({ partnerTier: { $exists: true, $ne: null } })
      .select('name email role partnerTier partnerAccessCode createdAt');
    console.log(`Users with partnerTier field: ${usersWithPartnerTier.length}`);
    
    const usersWithAccessCode = await User.find({ partnerAccessCode: { $exists: true, $ne: null } })
      .select('name email role partnerTier partnerAccessCode createdAt');
    console.log(`Users with partnerAccessCode: ${usersWithAccessCode.length}\n`);

    // Show all users that should be partners
    const allPotentialPartners = await User.find({
      $or: [
        { role: 'partner' },
        { partnerTier: { $exists: true, $ne: null } },
        { partnerAccessCode: { $exists: true, $ne: null } }
      ]
    }).select('name email role partnerTier partnerAccessCode isCsrUser createdAt');

    if (allPotentialPartners.length > 0) {
      console.log('=== ALL USERS WITH PARTNER DATA ===\n');
      allPotentialPartners.forEach(user => {
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Partner Tier: ${user.partnerTier || 'NONE'}`);
        console.log(`Access Code: ${user.partnerAccessCode || 'NONE'}`);
        console.log(`CSR User: ${user.isCsrUser ? 'Yes' : 'No'}`);
        console.log(`Created: ${user.createdAt.toLocaleString()}`);
        console.log('---\n');
      });
    } else {
      console.log('NO USERS WITH PARTNER DATA FOUND!\n');
    }

    // Check for recently deleted users (if they had payments)
    const paymentsWithDeletedUsers = allPayments.filter(p => !p.userId);
    if (paymentsWithDeletedUsers.length > 0) {
      console.log('=== PAYMENTS WITH DELETED USERS ===\n');
      console.log(`Found ${paymentsWithDeletedUsers.length} payments where user was deleted\n`);
      paymentsWithDeletedUsers.forEach(payment => {
        console.log(`Payment ID: ${payment._id}`);
        console.log(`Date: ${payment.createdAt.toLocaleString()}`);
        console.log(`Amount: $${payment.amount}`);
        console.log(`Is Partner Purchase: ${payment.isPartnerPurchase ? 'YES' : 'No'}`);
        console.log(`Partner Tier: ${payment.partnerTier || 'N/A'}`);
        console.log('---\n');
      });
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

investigatePartnerData();
