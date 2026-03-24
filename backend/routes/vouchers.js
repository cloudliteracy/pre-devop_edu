const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const superAdminOnly = require('../middleware/superAdminOnly');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/vouchers/');
  },
  filename: (req, file, cb) => {
    cb(null, `vouchers-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Super Admin routes
router.post('/upload-single', auth, superAdminOnly, voucherController.uploadSingleVoucher);
router.post('/upload-bulk', auth, superAdminOnly, upload.single('file'), voucherController.uploadBulkVouchers);
router.get('/all', auth, superAdminOnly, voucherController.getAllVouchers);
router.put('/:id/assign', auth, superAdminOnly, voucherController.assignVoucher);
router.delete('/:id/revoke', auth, superAdminOnly, voucherController.revokeVoucher);

// All Admins routes
router.get('/stats', auth, adminAuth, voucherController.getVoucherStats);
router.get('/activity-logs', auth, adminAuth, voucherController.getActivityLogs);

// Learner routes
router.get('/my-vouchers', auth, voucherController.getMyVouchers);
router.post('/redeem', auth, voucherController.redeemVoucher);

module.exports = router;
