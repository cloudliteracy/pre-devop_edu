const User = require('../models/User');
const Module = require('../models/Module');
const Payment = require('../models/Payment');
const Progress = require('../models/Progress');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalModules = await Module.countDocuments();
    
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalEnrollments = payments.filter(p => p.moduleId).length;
    
    const allProgress = await Progress.find();
    const avgCompletion = allProgress.length > 0
      ? (allProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / allProgress.length).toFixed(1)
      : 0;

    res.json({
      totalUsers,
      totalModules,
      totalRevenue: totalRevenue.toFixed(2),
      totalEnrollments,
      avgCompletion: parseFloat(avgCompletion)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('purchasedModules', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Calculate progress for each user
    const usersWithProgress = await Promise.all(users.map(async (user) => {
      const userProgress = await Progress.find({ userId: user._id }).populate('moduleId', 'title');
      
      let overallProgress = 0;
      if (userProgress.length > 0) {
        const totalCompletion = userProgress.reduce((sum, p) => sum + p.completionPercentage, 0);
        overallProgress = Math.round(totalCompletion / userProgress.length);
      }

      return {
        ...user.toObject(),
        overallProgress,
        moduleProgress: userProgress.map(p => ({
          moduleId: p.moduleId?._id,
          moduleTitle: p.moduleId?.title,
          completionPercentage: p.completionPercentage,
          videosWatched: p.videosWatched.length,
          pdfsDownloaded: p.pdfsDownloaded.length,
          quizCompleted: p.quizCompleted,
          quizScore: p.quizScore
        }))
      };
    }));

    const count = await User.countDocuments(query);

    res.json({
      users: usersWithProgress,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password')
      .populate('purchasedModules', 'title price');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const progress = await Progress.find({ userId: id }).populate('moduleId', 'title');
    const payments = await Payment.find({ userId: id, status: 'completed' });
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      user,
      progress,
      totalSpent: totalSpent.toFixed(2),
      totalPurchases: payments.filter(p => p.moduleId).length,
      totalDonations: payments.filter(p => !p.moduleId).length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
};

exports.getModuleAnalytics = async (req, res) => {
  try {
    const modules = await Module.find();
    const analytics = [];

    for (const module of modules) {
      const enrollments = await Payment.countDocuments({ 
        moduleId: module._id, 
        status: 'completed' 
      });
      
      const revenue = await Payment.aggregate([
        { $match: { moduleId: module._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const progress = await Progress.find({ moduleId: module._id });
      const avgCompletion = progress.length > 0
        ? (progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length).toFixed(1)
        : 0;

      const quizScores = progress.filter(p => p.quizCompleted);
      const avgQuizScore = quizScores.length > 0
        ? (quizScores.reduce((sum, p) => sum + p.quizScore, 0) / quizScores.length).toFixed(1)
        : 0;

      analytics.push({
        moduleId: module._id,
        title: module.title,
        enrollments,
        revenue: revenue[0]?.total || 0,
        avgCompletion: parseFloat(avgCompletion),
        avgQuizScore: parseFloat(avgQuizScore),
        quizCompletions: quizScores.length
      });
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const recentUsers = await User.find({ role: 'user' })
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('userId', 'name email')
      .populate('moduleId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentProgress = await Progress.find({ quizCompleted: true })
      .populate('userId', 'name')
      .populate('moduleId', 'title')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      recentUsers,
      recentPayments,
      recentProgress
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity', error: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    console.log('Create admin request:', req.body);
    console.log('req.user:', req.user);
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    const requestingUser = req.user;
    console.log('Requesting user isSuperAdmin:', requestingUser?.isSuperAdmin);

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can create new admins' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    console.log('Creating admin with temp password');

    const newAdmin = new User({
      name,
      email,
      password: tempPassword,
      role: 'admin',
      isSuperAdmin: false,
      mustChangePassword: true
    });

    await newAdmin.save();
    console.log('Admin created successfully');

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email
      },
      temporaryPassword: tempPassword
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin', error: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admins', error: error.message });
  }
};

exports.toggleAdminSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;
    const targetAdmin = await User.findById(id);

    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (targetAdmin.isSuperAdmin) {
      return res.status(403).json({ message: 'Cannot suspend super admin' });
    }

    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can suspend/reinstate admins' });
    }

    targetAdmin.isSuspended = !targetAdmin.isSuspended;
    await targetAdmin.save();

    // If suspending, force logout the admin via socket
    if (targetAdmin.isSuspended) {
      const io = req.app.get('io');
      if (io) {
        io.emit('admin-suspended', { email: targetAdmin.email });
        console.log('Emitted admin-suspended event for:', targetAdmin.email);
      }
    }

    res.json({
      message: `Admin ${targetAdmin.isSuspended ? 'suspended' : 'reinstated'} successfully`,
      admin: {
        id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        isSuspended: targetAdmin.isSuspended
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update admin status', error: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can delete admins' });
    }

    const targetAdmin = await User.findById(id);

    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (targetAdmin.isSuperAdmin) {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }

    // Force logout the admin via socket before deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('admin-suspended', { email: targetAdmin.email });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete admin', error: error.message });
  }
};

exports.toggleContentUploadAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can manage content upload access' });
    }

    const targetAdmin = await User.findById(id);

    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    targetAdmin.canUploadContent = !targetAdmin.canUploadContent;
    await targetAdmin.save();

    res.json({
      message: `Content upload access ${targetAdmin.canUploadContent ? 'granted' : 'revoked'} successfully`,
      admin: {
        id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        canUploadContent: targetAdmin.canUploadContent
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update content upload access', error: error.message });
  }
};
