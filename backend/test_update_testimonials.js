const mongoose = require('mongoose');
const Testimonial = require('./models/Testimonial');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // 1. Get all testimonials
    const tests = await Testimonial.find().populate('userId', 'name');
    console.log("Looking at Testimonials:");
    for (const t of tests) {
      console.log(`Testimonial ID: ${t._id}, User: ${t.userId?.name} (${t.userId?._id}), Photo: ${t.profilePhoto}`);
      
      if (t.userId) {
        // Query the actual User
        const u = await User.findById(t.userId._id);
        console.log(`  -> Actual User Photo in DB: ${u?.profilePhoto}`);
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
