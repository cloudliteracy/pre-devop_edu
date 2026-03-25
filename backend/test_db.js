const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(3);
    console.log("Recent Users:");
    users.forEach(u => console.log(`Name: ${u.name}, Email: ${u.email}, ProfilePhoto: ${u.profilePhoto}`));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
