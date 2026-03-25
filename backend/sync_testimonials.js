const mongoose = require('mongoose');
const Testimonial = require('./models/Testimonial');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    let count = 0;
    const testimonials = await Testimonial.find();
    for (const t of testimonials) {
      if (!t.userId) continue;
      const u = await User.findById(t.userId);
      if (u && u.profilePhoto && u.profilePhoto !== t.profilePhoto) {
        t.profilePhoto = u.profilePhoto;
        await t.save();
        count++;
        console.log(`Synced testimonial ID ${t._id} for user ${t.userId}`);
      }
    }
    console.log(`Synchronization complete. Synced ${count} testimonials.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
