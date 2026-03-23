const Visitor = require('../models/Visitor');

const trackVisitor = async (req, res, next) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const ip = clientIp.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Unknown';

    let userType = 'guest';
    let userId = null;

    if (req.user) {
      userId = req.user._id;
      if (req.user.isSuperAdmin) {
        userType = 'super_admin';
      } else if (req.user.role === 'admin') {
        userType = 'admin';
      } else {
        userType = 'learner';
      }
    }

    const existingVisitor = await Visitor.findOne({
      $or: [
        { ipAddress: ip, userAgent: userAgent, userId: null },
        { userId: userId }
      ]
    });

    if (existingVisitor) {
      existingVisitor.lastSeen = new Date();
      if (userId) {
        existingVisitor.userId = userId;
        existingVisitor.userType = userType;
      }
      await existingVisitor.save();
    } else {
      await Visitor.create({
        ipAddress: ip,
        userAgent: userAgent,
        userId: userId,
        userType: userType
      });
    }
  } catch (error) {
    console.error('Visitor tracking error:', error);
  }

  next();
};

module.exports = trackVisitor;
