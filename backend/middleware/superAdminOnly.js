const superAdminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed', error: error.message });
  }
};

module.exports = superAdminOnly;
