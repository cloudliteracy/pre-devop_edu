const User = require('../models/User');

const verifyModuleAccess = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.purchasedModules.includes(moduleId)) {
      return res.status(403).json({ message: 'Payment required to access this module' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying access' });
  }
};

module.exports = verifyModuleAccess;
