require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createPrimarySuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    let admin = await User.findOne({ email: 'admin@cloudliteracy.com' });
    
    if (admin) {
      console.log('Admin already exists. Updating...');
      admin.isSuperAdmin = true;
      admin.isPrimarySuperAdmin = true;
      admin.canCreateSuperAdmins = true;
      admin.isSuspended = false;
      admin.mustChangePassword = false;
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Primary super admin updated!');
    } else {
      console.log('Creating new primary super admin...');
      admin = new User({
        name: 'Admin',
        email: 'admin@cloudliteracy.com',
        password: 'admin123',
        role: 'admin',
        isSuperAdmin: true,
        isPrimarySuperAdmin: true,
        canCreateSuperAdmins: true,
        isSuspended: false,
        mustChangePassword: false,
        country: 'CM'
      });
      await admin.save();
      console.log('✅ Primary super admin created successfully!');
    }

    console.log('\n📋 Login Credentials:');
    console.log('Email: admin@cloudliteracy.com');
    console.log('Password: admin123');
    console.log('\nRole:', admin.role);
    console.log('Super Admin:', admin.isSuperAdmin);
    console.log('Primary Super Admin:', admin.isPrimarySuperAdmin);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createPrimarySuperAdmin();
