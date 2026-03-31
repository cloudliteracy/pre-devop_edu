require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkAndFixSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the super admin
    const superAdmin = await User.findOne({ email: 'admin@cloudliteracy.com' });
    
    if (!superAdmin) {
      console.log('❌ Super admin not found!');
      return;
    }

    console.log('\n📋 Current Super Admin Status:');
    console.log('Email:', superAdmin.email);
    console.log('isSuperAdmin:', superAdmin.isSuperAdmin);
    console.log('isPrimarySuperAdmin:', superAdmin.isPrimarySuperAdmin);

    if (!superAdmin.isPrimarySuperAdmin) {
      console.log('\n🔧 Fixing: Setting isPrimarySuperAdmin to true...');
      superAdmin.isPrimarySuperAdmin = true;
      await superAdmin.save();
      console.log('✅ Super admin updated successfully!');
    } else {
      console.log('\n✅ Super admin already has isPrimarySuperAdmin set to true');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAndFixSuperAdmin();
