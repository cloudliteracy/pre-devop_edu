const primarySuperAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.isPrimarySuperAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. This action requires primary super admin privileges.' 
    });
  }

  next();
};

module.exports = primarySuperAdminOnly;
