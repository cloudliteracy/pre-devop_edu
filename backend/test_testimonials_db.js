const mongoose = require('mongoose');
const Testimonial = require('./models/Testimonial');
require('dotenv').config();
const http = require('http');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const tests = await Testimonial.find({ profilePhoto: { $exists: true, $ne: null } }).limit(2);
    console.log("Found testimonials with photos:");
    for (const t of tests) {
      console.log(`ID: ${t._id}, Photo: ${t.profilePhoto}`);
      
      const normalizedPath = t.profilePhoto.startsWith('/') ? t.profilePhoto : '/' + t.profilePhoto.replace(/\\/g, '/');
      const url = `http://localhost:5000${normalizedPath}`;
      console.log(`Testing URL: ${url}`);
      
      // Perform HTTP request
      await new Promise((resolve) => {
        http.get(url, (res) => {
          console.log(`Response Code: ${res.statusCode}, Content-Type: ${res.headers['content-type']}`);
          resolve();
        }).on('error', (e) => {
          console.error(`Error requesting URL: ${e.message}`);
          resolve();
        });
      });
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
