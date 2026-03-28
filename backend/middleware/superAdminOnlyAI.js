/**
 * Middleware to ensure only super admins can access AI QR features
 * Checks for isSuperAdmin flag on user object
 */
const superAdminOnlyAI = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if user is super admin (primary or regular)
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. AI QR is only available to Super Admins.',
      requiredRole: 'Super Admin'
    });
  }

  next();
};

module.exports = superAdminOnlyAI;
