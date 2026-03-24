const User = require('../models/User');

const verifyModuleAccess = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const user = await User.findById(req.user._id);

    // Admins, Super Admins bypass payment - they can access all modules
    if (user.role === 'admin' || user.isSuperAdmin) {
      return next();
    }

    // CSR Users with valid (non-expired) access bypass payment
    if (user.isCsrUser && user.csrAccessExpiresAt && new Date() < user.csrAccessExpiresAt) {
      return next();
    }

    // Regular users (learners) must have purchased the module
    if (!user.purchasedModules.includes(moduleId)) {
      return res.status(403).json({ message: 'Payment required to access this module' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying access' });
  }
};

module.exports = verifyModuleAccess;
