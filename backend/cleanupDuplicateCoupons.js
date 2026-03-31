const mongoose = require('mongoose');
const Coupon = require('./models/Coupon');
const Referral = require('./models/Referral');
require('dotenv').config();

async function cleanupDuplicateCoupons() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with multiple coupons
    const allCoupons = await Coupon.find({ isUsed: false }).sort({ createdAt: 1 });
    
    const couponsByUser = {};
    allCoupons.forEach(coupon => {
      const userId = coupon.userId.toString();
      if (!couponsByUser[userId]) {
        couponsByUser[userId] = [];
      }
      couponsByUser[userId].push(coupon);
    });

    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    // For each user with multiple coupons
    for (const userId in couponsByUser) {
      const userCoupons = couponsByUser[userId];
      
      if (userCoupons.length > 1) {
        console.log(`\nUser ${userId} has ${userCoupons.length} coupons`);
        duplicatesFound += userCoupons.length - 1;

        // Count how many referrals this user actually made
        const referralCount = await Referral.countDocuments({ 
          referrerId: userId,
          status: 'completed'
        });

        console.log(`  - Actual referrals: ${referralCount}`);
        console.log(`  - Coupons issued: ${userCoupons.length}`);

        // Keep only the number of coupons equal to referral count
        const couponsToKeep = userCoupons.slice(0, referralCount);
        const couponsToDelete = userCoupons.slice(referralCount);

        console.log(`  - Keeping: ${couponsToKeep.length} coupons`);
        console.log(`  - Deleting: ${couponsToDelete.length} duplicate coupons`);

        // Delete duplicate coupons
        for (const coupon of couponsToDelete) {
          await Coupon.findByIdAndDelete(coupon._id);
          console.log(`    ✓ Deleted coupon: ${coupon.code}`);
          duplicatesRemoved++;
        }
      }
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Duplicate coupons found: ${duplicatesFound}`);
    console.log(`Duplicate coupons removed: ${duplicatesRemoved}`);
    console.log('Cleanup completed successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanupDuplicateCoupons();
