const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const AuditLog = require('./models/AuditLog');

async function checkAdminActivity() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all admins
    const admins = await User.find({ 
      $or: [
        { role: 'admin' },
        { isSuperAdmin: true }
      ]
    }).select('name email role isSuperAdmin isPrimarySuperAdmin canCreateSuperAdmins createdAt');

    console.log('=== ALL ADMIN USERS ===\n');
    console.log(`Total Admins: ${admins.length}\n`);
    
    admins.forEach(admin => {
      console.log(`Name: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Super Admin: ${admin.isSuperAdmin ? 'YES' : 'No'}`);
      console.log(`Primary Super Admin: ${admin.isPrimarySuperAdmin ? 'YES' : 'No'}`);
      console.log(`Can Create Super Admins: ${admin.canCreateSuperAdmins ? 'YES' : 'No'}`);
      console.log(`Created: ${admin.createdAt.toLocaleString()}`);
      console.log('---\n');
    });

    // Check login attempts today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogins = await AuditLog.find({
      action: 'LOGIN_ATTEMPT',
      createdAt: { $gte: today }
    }).populate('adminId', 'name email role isSuperAdmin isPrimarySuperAdmin')
      .sort({ createdAt: -1 });

    console.log('=== LOGIN ATTEMPTS TODAY ===\n');
    console.log(`Total Logins: ${todayLogins.length}\n`);
    
    if (todayLogins.length > 0) {
      todayLogins.forEach(log => {
        console.log(`Time: ${log.createdAt.toLocaleString()}`);
        console.log(`Admin: ${log.adminId?.name || 'Unknown'} (${log.adminId?.email || 'N/A'})`);
        console.log(`Super Admin: ${log.adminId?.isSuperAdmin ? 'YES' : 'No'}`);
        console.log(`Primary: ${log.adminId?.isPrimarySuperAdmin ? 'YES' : 'No'}`);
        console.log(`Details: ${log.details}`);
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

checkAdminActivity();
