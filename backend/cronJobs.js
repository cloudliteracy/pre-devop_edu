const cron = require('node-cron');
const Voucher = require('./models/Voucher');
const VoucherActivityLog = require('./models/VoucherActivityLog');

// Run every day at midnight (00:00)
const startVoucherExpirationCron = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running voucher expiration check...');
      
      const now = new Date();
      
      // Find all vouchers that are expired but not marked as expired
      const expiredVouchers = await Voucher.find({
        expirationDate: { $lt: now },
        status: { $in: ['unused', 'assigned'] }
      });

      if (expiredVouchers.length === 0) {
        console.log('No vouchers to expire');
        return;
      }

      // Update all expired vouchers
      const updatePromises = expiredVouchers.map(async (voucher) => {
        voucher.status = 'expired';
        await voucher.save();

        // Log the expiration
        await VoucherActivityLog.create({
          voucherId: voucher._id,
          action: 'expired',
          performedBy: null,
          details: `Voucher automatically expired (${voucher.examType})`,
          ipAddress: 'system'
        });
      });

      await Promise.all(updatePromises);

      console.log(`Successfully expired ${expiredVouchers.length} vouchers`);
    } catch (error) {
      console.error('Error in voucher expiration cron:', error);
    }
  });

  console.log('Voucher expiration cron job started (runs daily at midnight)');
};

module.exports = { startVoucherExpirationCron };
