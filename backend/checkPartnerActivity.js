const mongoose = require('mongoose');
require('dotenv').config();

const AuditLog = require('./models/AuditLog');
const User = require('./models/User');

async function checkRecentPartnerActivity() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all partner-related actions
    const partnerActions = await AuditLog.find({
      createdAt: { $gte: last24Hours },
      action: { $in: ['PARTNER_DELETE', 'PARTNER_SUSPEND', 'PARTNER_CODE_GENERATE', 'PARTNER_CODE_REVOKE'] }
    })
    .populate('adminId', 'name email isPrimarySuperAdmin')
    .sort({ createdAt: -1 });

    console.log('=== PARTNER ACTIVITY (Last 24 Hours) ===\n');
    
    if (partnerActions.length === 0) {
      console.log('No partner-related actions found in the last 24 hours.\n');
    } else {
      partnerActions.forEach(log => {
        console.log(`[${log.createdAt.toLocaleString()}]`);
        console.log(`Action: ${log.action}`);
        console.log(`Admin: ${log.adminId?.name} (${log.adminId?.email})${log.adminId?.isPrimarySuperAdmin ? ' [PRIMARY SUPER ADMIN]' : ''}`);
        console.log(`Target: ${log.targetUserName} (${log.targetUserEmail})`);
        console.log(`Details: ${log.details}`);
        console.log('---\n');
      });
    }

    // Check current partners in database
    const currentPartners = await User.find({
      $or: [
        { role: 'partner' },
        { partnerTier: { $exists: true, $ne: null } }
      ]
    }).select('name email role partnerTier partnerAccessCode createdAt');

    console.log('=== CURRENT PARTNERS IN DATABASE ===\n');
    console.log(`Total Partners: ${currentPartners.length}\n`);
    
    if (currentPartners.length > 0) {
      currentPartners.forEach(partner => {
        console.log(`Name: ${partner.name}`);
        console.log(`Email: ${partner.email}`);
        console.log(`Tier: ${partner.partnerTier || 'N/A'}`);
        console.log(`Access Code: ${partner.partnerAccessCode || 'Not Generated'}`);
        console.log(`Joined: ${partner.createdAt.toLocaleDateString()}`);
        console.log('---\n');
      });
    } else {
      console.log('No partners found in database.\n');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRecentPartnerActivity();
