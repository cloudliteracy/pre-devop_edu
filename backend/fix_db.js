const mongoose = require('mongoose');
const User = require('./models/User');
const Testimonial = require('./models/Testimonial');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // Pick an existing photo from older testimonials to use as a fallback dummy picture
    const fallbackPhoto = "uploads\\testimonials\\profile-1774371841069-205372481.png";

    const updateResult = await User.updateMany(
      { profilePhoto: { $exists: false } },
      { $set: { profilePhoto: fallbackPhoto } }
    );
    
    const updateResult2 = await User.updateMany(
      { profilePhoto: null },
      { $set: { profilePhoto: fallbackPhoto } }
    );

    console.log(`Updated ${updateResult.modifiedCount + updateResult2.modifiedCount} users with a fallback profile photo.`);

    const testResult = await Testimonial.updateMany(
      { profilePhoto: null },
      { $set: { profilePhoto: fallbackPhoto } }
    );

    console.log(`Updated ${testResult.modifiedCount} testimonials with a fallback profile photo.`);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
