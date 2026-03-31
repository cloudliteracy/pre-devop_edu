const Voucher = require('../models/Voucher');
const VoucherActivityLog = require('../models/VoucherActivityLog');
const User = require('../models/User');
const { encrypt, decrypt, maskCode } = require('../utils/voucherEncryption');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');

// Log voucher activity
const logActivity = async (voucherId, action, performedBy, details, ipAddress) => {
  try {
    await VoucherActivityLog.create({
      voucherId,
      action,
      performedBy,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Upload single voucher (Super Admin only)
exports.uploadSingleVoucher = async (req, res) => {
  try {
    if (!req.user.isPrimarySuperAdmin) {
      return res.status(403).json({ message: 'Only primary super admin can upload vouchers' });
    }

    const { code, examType, expirationDate, notes } = req.body;

    if (!code || !examType || !expirationDate) {
      return res.status(400).json({ message: 'Code, exam type, and expiration date are required' });
    }

    // Check if code already exists
    const existingVoucher = await Voucher.findOne({ code: encrypt(code) });
    if (existingVoucher) {
      return res.status(400).json({ message: 'Voucher code already exists' });
    }

    const voucher = new Voucher({
      code: encrypt(code),
      examType,
      expirationDate: new Date(expirationDate),
      createdBy: req.user._id,
      metadata: { notes }
    });

    await voucher.save();

    await logActivity(
      voucher._id,
      'created',
      req.user._id,
      `Voucher created for ${examType}`,
      req.ip
    );

    res.status(201).json({
      message: 'Voucher created successfully',
      voucher: {
        id: voucher._id,
        examType: voucher.examType,
        expirationDate: voucher.expirationDate,
        status: voucher.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create voucher', error: error.message });
  }
};

// Upload bulk vouchers (Super Admin only)
exports.uploadBulkVouchers = async (req, res) => {
  try {
    if (!req.user.isPrimarySuperAdmin) {
      return res.status(403).json({ message: 'Only primary super admin can upload vouchers' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const vouchers = [];
    const batchId = `BATCH-${Date.now()}`;

    if (fileExtension === 'csv') {
      // Parse CSV
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            for (const row of results) {
              if (row.code && row.examType && row.expirationDate) {
                const existingVoucher = await Voucher.findOne({ code: encrypt(row.code) });
                if (!existingVoucher) {
                  vouchers.push({
                    code: encrypt(row.code),
                    examType: row.examType,
                    expirationDate: new Date(row.expirationDate),
                    createdBy: req.user._id,
                    metadata: {
                      batchId,
                      notes: row.notes || ''
                    }
                  });
                }
              }
            }

            const created = await Voucher.insertMany(vouchers);

            // Log bulk upload
            for (const voucher of created) {
              await logActivity(
                voucher._id,
                'bulk_upload',
                req.user._id,
                `Bulk upload - Batch ${batchId}`,
                req.ip
              );
            }

            fs.unlinkSync(filePath);

            res.json({
              message: `${created.length} vouchers uploaded successfully`,
              batchId,
              count: created.length
            });
          } catch (error) {
            fs.unlinkSync(filePath);
            res.status(500).json({ message: 'Failed to process CSV', error: error.message });
          }
        });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      for (const row of data) {
        if (row.code && row.examType && row.expirationDate) {
          const existingVoucher = await Voucher.findOne({ code: encrypt(row.code) });
          if (!existingVoucher) {
            vouchers.push({
              code: encrypt(row.code),
              examType: row.examType,
              expirationDate: new Date(row.expirationDate),
              createdBy: req.user._id,
              metadata: {
                batchId,
                notes: row.notes || ''
              }
            });
          }
        }
      }

      const created = await Voucher.insertMany(vouchers);

      // Log bulk upload
      for (const voucher of created) {
        await logActivity(
          voucher._id,
          'bulk_upload',
          req.user._id,
          `Bulk upload - Batch ${batchId}`,
          req.ip
        );
      }

      fs.unlinkSync(filePath);

      res.json({
        message: `${created.length} vouchers uploaded successfully`,
        batchId,
        count: created.length
      });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Invalid file format. Only CSV and Excel files are supported.' });
    }
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload vouchers', error: error.message });
  }
};

// Get all vouchers (Super Admin only)
exports.getAllVouchers = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, examType, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (examType) query.examType = examType;

    const vouchers = await Voucher.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Voucher.countDocuments(query);

    const vouchersWithMaskedCodes = vouchers.map(v => ({
      ...v.toObject(),
      codeMasked: maskCode(v.code),
      codeDecrypted: decrypt(v.code)
    }));

    res.json({
      vouchers: vouchersWithMaskedCodes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vouchers', error: error.message });
  }
};

// Get voucher statistics (All Admins)
exports.getVoucherStats = async (req, res) => {
  try {
    const total = await Voucher.countDocuments();
    const unused = await Voucher.countDocuments({ status: 'unused' });
    const assigned = await Voucher.countDocuments({ status: 'assigned' });
    const redeemed = await Voucher.countDocuments({ status: 'redeemed' });
    const expired = await Voucher.countDocuments({ status: 'expired' });
    const revoked = await Voucher.countDocuments({ status: 'revoked' });

    const examTypes = await Voucher.aggregate([
      { $group: { _id: '$examType', count: { $sum: 1 } } }
    ]);

    const recentActivity = await VoucherActivityLog.find()
      .populate('performedBy', 'name email')
      .populate('voucherId', 'examType')
      .sort({ performedAt: -1 })
      .limit(10);

    res.json({
      total,
      unused,
      assigned,
      redeemed,
      expired,
      revoked,
      examTypes,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};

// Assign voucher to learner (Super Admin only)
exports.assignVoucher = async (req, res) => {
  try {
    if (!req.user.isPrimarySuperAdmin) {
      return res.status(403).json({ message: 'Only primary super admin can assign vouchers' });
    }

    const { id } = req.params;
    const { userId } = req.body;

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.status !== 'unused') {
      return res.status(400).json({ message: 'Voucher is not available for assignment' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    voucher.status = 'assigned';
    voucher.assignedTo = userId;
    voucher.assignedAt = new Date();
    await voucher.save();

    await logActivity(
      voucher._id,
      'assigned',
      req.user._id,
      `Assigned to ${user.name} (${user.email})`,
      req.ip
    );

    res.json({
      message: 'Voucher assigned successfully',
      voucher: {
        id: voucher._id,
        examType: voucher.examType,
        assignedTo: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign voucher', error: error.message });
  }
};

// Get my vouchers (Learners)
exports.getMyVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ assignedTo: req.user._id })
      .select('-createdBy')
      .sort({ assignedAt: -1 });

    const vouchersWithDecryptedCodes = vouchers.map(v => ({
      ...v.toObject(),
      code: decrypt(v.code)
    }));

    res.json(vouchersWithDecryptedCodes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vouchers', error: error.message });
  }
};

// Redeem voucher (Learners)
exports.redeemVoucher = async (req, res) => {
  try {
    const { voucherId } = req.body;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This voucher is not assigned to you' });
    }

    if (voucher.status !== 'assigned') {
      return res.status(400).json({ message: 'Voucher cannot be redeemed' });
    }

    if (new Date() > voucher.expirationDate) {
      voucher.status = 'expired';
      await voucher.save();
      return res.status(400).json({ message: 'Voucher has expired' });
    }

    voucher.status = 'redeemed';
    voucher.redeemedAt = new Date();
    await voucher.save();

    await logActivity(
      voucher._id,
      'redeemed',
      req.user._id,
      `Redeemed by ${req.user.name}`,
      req.ip
    );

    res.json({
      message: 'Voucher redeemed successfully',
      voucher: {
        id: voucher._id,
        examType: voucher.examType,
        redeemedAt: voucher.redeemedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to redeem voucher', error: error.message });
  }
};

// Revoke voucher (Super Admin only)
exports.revokeVoucher = async (req, res) => {
  try {
    if (!req.user.isPrimarySuperAdmin) {
      return res.status(403).json({ message: 'Only primary super admin can revoke vouchers' });
    }

    const { id } = req.params;

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    voucher.status = 'revoked';
    await voucher.save();

    await logActivity(
      voucher._id,
      'revoked',
      req.user._id,
      'Voucher revoked by super admin',
      req.ip
    );

    res.json({ message: 'Voucher revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to revoke voucher', error: error.message });
  }
};

// Get activity logs (All Admins)
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const logs = await VoucherActivityLog.find()
      .populate('performedBy', 'name email')
      .populate('voucherId', 'examType')
      .sort({ performedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await VoucherActivityLog.countDocuments();

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
  }
};
