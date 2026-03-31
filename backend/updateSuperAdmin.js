require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ email: 'admin@cloudliteracy.com' });
    
    if (admin) {
      admin.isSuperAdmin = true;
      admin.isPrimarySuperAdmin = true;
      admin.canCreateSuperAdmins = true;
      admin.isSuspended = false;
      admin.mustChangePassword = false;
      await admin.save();
      console.log('✅ Primary super admin updated successfully!');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Super Admin:', admin.isSuperAdmin);
      console.log('Primary Super Admin:', admin.isPrimarySuperAdmin);
    } else {
      console.log('❌ Admin not found. Please run createAdmin.js first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateSuperAdmin();
