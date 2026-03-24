const CSRCode = require('../models/CSRCode');
const User = require('../models/User');
const crypto = require('crypto');

// Generate unique CSR code
const generateUniqueCode = () => {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CSR-${part1}-${part2}`;
};

// Generate CSR code (Super Admin only)
exports.generateCode = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can generate CSR codes' });
    }

    const { expiresAt, maxUses } = req.body;

    if (!expiresAt || !maxUses) {
      return res.status(400).json({ message: 'Expiration date and max uses are required' });
    }

    const code = generateUniqueCode();

    const csrCode = new CSRCode({
      code,
      createdBy: req.user._id,
      expiresAt: new Date(expiresAt),
      maxUses: parseInt(maxUses)
    });

    await csrCode.save();
    await csrCode.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'CSR code generated successfully',
      code: csrCode
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate CSR code', error: error.message });
  }
};

// Verify CSR code (Public)
exports.verifyCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    const csrCode = await CSRCode.findOne({ code: code.toUpperCase() });

    if (!csrCode) {
      return res.status(404).json({ message: 'Invalid code' });
    }

    if (!csrCode.isActive) {
      return res.status(400).json({ message: 'This code has been deactivated' });
    }

    if (new Date() > csrCode.expiresAt) {
      return res.status(400).json({ message: 'This code has expired' });
    }

    if (csrCode.currentUses >= csrCode.maxUses) {
      return res.status(400).json({ message: 'This code has reached its maximum usage limit' });
    }

    res.json({
      message: 'Code is valid',
      valid: true,
      code: csrCode.code
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify code', error: error.message });
  }
};

// Get all CSR codes (Super Admin only)
exports.getAllCodes = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can view CSR codes' });
    }

    const codes = await CSRCode.find()
      .populate('createdBy', 'name email')
      .populate('usedBy.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(codes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch CSR codes', error: error.message });
  }
};

// Toggle CSR code active status (Super Admin only)
exports.toggleCodeStatus = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can modify CSR codes' });
    }

    const { id } = req.params;
    const csrCode = await CSRCode.findById(id);

    if (!csrCode) {
      return res.status(404).json({ message: 'CSR code not found' });
    }

    csrCode.isActive = !csrCode.isActive;
    await csrCode.save();

    res.json({
      message: `Code ${csrCode.isActive ? 'activated' : 'deactivated'} successfully`,
      code: csrCode
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle code status', error: error.message });
  }
};

// Get CSR analytics (Super Admin only)
exports.getAnalytics = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can view CSR analytics' });
    }

    const totalCodes = await CSRCode.countDocuments();
    const activeCodes = await CSRCode.countDocuments({ isActive: true, expiresAt: { $gt: new Date() } });
    const expiredCodes = await CSRCode.countDocuments({ expiresAt: { $lte: new Date() } });
    const totalCsrUsers = await User.countDocuments({ isCsrUser: true });

    const codes = await CSRCode.find();
    let totalUses = 0;
    let availableSlots = 0;

    codes.forEach(code => {
      totalUses += code.currentUses;
      if (code.isActive && new Date() < code.expiresAt) {
        availableSlots += (code.maxUses - code.currentUses);
      }
    });

    const recentCsrUsers = await User.find({ isCsrUser: true })
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalCodes,
      activeCodes,
      expiredCodes,
      totalCsrUsers,
      totalUses,
      availableSlots,
      recentCsrUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

// Delete CSR code (Super Admin only)
exports.deleteCode = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can delete CSR codes' });
    }

    const { id } = req.params;
    const csrCode = await CSRCode.findById(id);

    if (!csrCode) {
      return res.status(404).json({ message: 'CSR code not found' });
    }

    await CSRCode.findByIdAndDelete(id);

    res.json({
      message: 'CSR code deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete code', error: error.message });
  }
};
