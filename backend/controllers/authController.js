const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

exports.register = async (req, res) => {
  try {
    const { name, email, password, csrCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userData = { name, email, password };

    if (req.file) {
      userData.profilePhoto = `/` + req.file.path.replace(/\\/g, '/');
    }

    // Handle CSR code if provided
    if (csrCode) {
      const CSRCode = require('../models/CSRCode');
      const code = await CSRCode.findOne({ code: csrCode.toUpperCase() });

      if (!code) {
        return res.status(400).json({ message: 'Invalid CSR code' });
      }

      if (!code.isActive) {
        return res.status(400).json({ message: 'This CSR code has been deactivated' });
      }

      if (new Date() > code.expiresAt) {
        return res.status(400).json({ message: 'This CSR code has expired' });
      }

      if (code.currentUses >= code.maxUses) {
        return res.status(400).json({ message: 'This CSR code has reached its maximum usage limit' });
      }

      userData.isCsrUser = true;
      userData.csrCodeUsed = code._id;
      // Set expiration based on code's accessDurationMonths
      const durationMs = (code.accessDurationMonths || 12) * 30 * 24 * 60 * 60 * 1000;
      userData.csrAccessExpiresAt = new Date(Date.now() + durationMs);

      const user = new User(userData);
      await user.save();

      // Update CSR code usage
      code.currentUses += 1;
      code.usedBy.push({ userId: user._id, usedAt: new Date() });
      await code.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          profilePhoto: user.profilePhoto,
          isCsrUser: user.isCsrUser
        },
        message: `CSR registration successful! You now have free access to all modules for ${code.accessDurationMonths} months.`
      });
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePhoto: user.profilePhoto } });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact the administrator.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profilePhoto: user.profilePhoto,
        isSuperAdmin: user.isSuperAdmin,
        mustChangePassword: user.mustChangePassword
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password change failed', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const emailResult = await sendPasswordResetEmail(email, resetUrl, user.name);

    if (emailResult.success) {
      res.json({ 
        message: 'Password reset link has been sent to your email',
        emailSent: true
      });
    } else {
      res.json({ 
        message: 'Email service unavailable. Here is your reset link',
        resetUrl,
        emailSent: false,
        expiresIn: '1 hour'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to process request', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};
