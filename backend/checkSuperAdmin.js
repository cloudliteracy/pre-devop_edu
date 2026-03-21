require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const admin = await User.findOne({ email: 'admin@cloudliteracy.com' });
    
    if (admin) {
      console.log('\n=== Super Admin Details ===');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('isSuperAdmin:', admin.isSuperAdmin);
      console.log('isSuspended:', admin.isSuspended);
      console.log('mustChangePassword:', admin.mustChangePassword);
    } else {
      console.log('Admin not found!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
