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

    const { codeName, expiresAt, maxUses, accessDurationMonths } = req.body;

    if (!codeName || !expiresAt || !maxUses || !accessDurationMonths) {
      return res.status(400).json({ message: 'Code name, expiration date, max uses, and access duration are required' });
    }

    const code = generateUniqueCode();

    const csrCode = new CSRCode({
      code,
      codeName,
      createdBy: req.user._id,
      expiresAt: new Date(expiresAt),
      maxUses: parseInt(maxUses),
      accessDurationMonths: parseInt(accessDurationMonths)
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
      .select('name email createdAt csrAccessExpiresAt isSuspended')
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

// Renew CSR user access (Super Admin only)
exports.renewCsrAccess = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can renew CSR access' });
    }

    const { userId } = req.params;
    const { months } = req.body;

    if (months === undefined || months === null || months === 0) {
      return res.status(400).json({ message: 'Valid extension/reduction period required' });
    }

    const user = await User.findById(userId);

    if (!user || !user.isCsrUser) {
      return res.status(404).json({ message: 'CSR user not found' });
    }

    const currentExpiry = user.csrAccessExpiresAt || new Date();
    const newExpiry = new Date(Math.max(currentExpiry, new Date()));
    newExpiry.setMonth(newExpiry.getMonth() + parseInt(months));

    // Prevent setting expiration in the past
    const now = new Date();
    if (newExpiry < now) {
      user.csrAccessExpiresAt = now; // Set to current time (immediate expiry)
    } else {
      user.csrAccessExpiresAt = newExpiry;
    }

    user.csrAccessRenewedBy = req.user._id;
    user.csrAccessRenewedAt = new Date();
    await user.save();

    const action = months > 0 ? 'extended' : 'reduced';
    const absMonths = Math.abs(months);

    res.json({
      message: `CSR access ${action} by ${absMonths} month(s)`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        csrAccessExpiresAt: user.csrAccessExpiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to renew access', error: error.message });
  }
};

// Expel CSR user (Super Admin only)
exports.expelCsrUser = async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can expel users' });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isCsrUser) {
      return res.status(400).json({ message: 'User is not a CSR user' });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'CSR user expelled successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to expel user', error: error.message });
  }
};
