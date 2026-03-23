module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const canUpload = req.user.isSuperAdmin || 
                    (req.user.role === 'admin' && req.user.canUploadContent);

  if (!canUpload) {
    return res.status(403).json({ 
      message: 'Content upload access denied. Contact super admin for permission.' 
    });
  }

  next();
};
