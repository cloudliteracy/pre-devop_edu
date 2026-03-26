const User = require('../models/User');
const Module = require('../models/Module');
const Payment = require('../models/Payment');
const Progress = require('../models/Progress');

exports.getDashboardStats = async (req, res) => {
  try {
    const Visitor = require('../models/Visitor');
    
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalModules = await Module.countDocuments();
    
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalEnrollments = payments.filter(p => p.moduleId).length;
    
    const allProgress = await Progress.find();
    const avgCompletion = allProgress.length > 0
      ? (allProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / allProgress.length).toFixed(1)
      : 0;

    // Visitor statistics
    const totalVisitors = await Visitor.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisitors = await Visitor.countDocuments({ visitedAt: { $gte: today } });
    
    const visitorsByType = await Visitor.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    const visitorBreakdown = {
      guest: 0,
      learner: 0,
      admin: 0,
      super_admin: 0
    };

    visitorsByType.forEach(item => {
      visitorBreakdown[item._id] = item.count;
    });

    res.json({
      totalUsers,
      totalModules,
      totalRevenue: totalRevenue.toFixed(2),
      totalEnrollments,
      avgCompletion: parseFloat(avgCompletion),
      visitors: {
        total: totalVisitors,
        today: todayVisitors,
        breakdown: visitorBreakdown
      }
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
        isSuspended: user.isSuspended,
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

exports.getQuizAnalytics = async (req, res) => {
  try {
    const { moduleId, search = '' } = req.query;
    
    const query = {};
    if (moduleId) query.moduleId = moduleId;
    
    const allProgress = await Progress.find(query)
      .populate('userId', 'name email')
      .populate('moduleId', 'title')
      .sort({ updatedAt: -1 });

    let filteredProgress = allProgress.filter(p => p.quizAttempts.length > 0);

    if (search) {
      filteredProgress = filteredProgress.filter(p => 
        p.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.userId?.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const totalAttempts = filteredProgress.reduce((sum, p) => sum + p.quizAttempts.length, 0);
    const passedAttempts = filteredProgress.reduce((sum, p) => 
      sum + p.quizAttempts.filter(a => a.passed).length, 0
    );
    const allScores = filteredProgress.flatMap(p => p.quizAttempts.map(a => a.score));
    const avgScore = allScores.length > 0 
      ? (allScores.reduce((sum, s) => sum + s, 0) / allScores.length).toFixed(1)
      : 0;

    const learners = filteredProgress.map(p => ({
      userId: p.userId._id,
      userName: p.userId.name,
      userEmail: p.userId.email,
      moduleId: p.moduleId._id,
      moduleName: p.moduleId.title,
      totalAttempts: p.quizAttempts.length,
      bestScore: Math.max(...p.quizAttempts.map(a => a.score)),
      latestScore: p.quizAttempts[p.quizAttempts.length - 1].score,
      passed: p.quizCompleted,
      certificateId: p.quizAttempts.find(a => a.certificateId)?.certificateId,
      attempts: p.quizAttempts.map(a => ({
        score: a.score,
        passed: a.passed,
        attemptedAt: a.attemptedAt,
        certificateId: a.certificateId,
        questions: a.questions
      }))
    }));

    res.json({
      summary: {
        totalAttempts,
        passedAttempts,
        passRate: totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(1) : 0,
        avgScore: parseFloat(avgScore),
        totalLearners: learners.length
      },
      learners
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz analytics', error: error.message });
  }
};

exports.exportQuizData = async (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const { moduleId } = req.query;
    
    const query = {};
    if (moduleId) query.moduleId = moduleId;
    
    const allProgress = await Progress.find(query)
      .populate('userId', 'name email')
      .populate('moduleId', 'title');

    const data = [];
    allProgress.forEach(p => {
      if (p.quizAttempts.length > 0) {
        p.quizAttempts.forEach(attempt => {
          data.push({
            'Learner Name': p.userId?.name || 'N/A',
            'Learner Email': p.userId?.email || 'N/A',
            'Module': p.moduleId?.title || 'N/A',
            'Score': attempt.score,
            'Passed': attempt.passed ? 'Yes' : 'No',
            'Certificate ID': attempt.certificateId || 'N/A',
            'Attempted At': new Date(attempt.attemptedAt).toLocaleString()
          });
        });
      }
    });

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('quiz-analytics.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export data', error: error.message });
  }
};

exports.toggleQuizAnalyticsAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can manage quiz analytics access' });
    }

    const targetAdmin = await User.findById(id);

    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    targetAdmin.canViewQuizAnalytics = !targetAdmin.canViewQuizAnalytics;
    await targetAdmin.save();

    res.json({
      message: `Quiz analytics access ${targetAdmin.canViewQuizAnalytics ? 'granted' : 'revoked'} successfully`,
      admin: {
        id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        canViewQuizAnalytics: targetAdmin.canViewQuizAnalytics
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quiz analytics access', error: error.message });
  }
};

exports.toggleSurveyAnalyticsAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can manage survey analytics access' });
    }

    const targetAdmin = await User.findById(id);

    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    targetAdmin.canViewSurveyAnalytics = !targetAdmin.canViewSurveyAnalytics;
    await targetAdmin.save();

    res.json({
      message: `Survey analytics access ${targetAdmin.canViewSurveyAnalytics ? 'granted' : 'revoked'} successfully`,
      admin: {
        id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        canViewSurveyAnalytics: targetAdmin.canViewSurveyAnalytics
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update survey analytics access', error: error.message });
  }
};

exports.getSurveyAnalytics = async (req, res) => {
  try {
    const Poll = require('../models/Poll');
    
    const polls = await Poll.find()
      .populate('user', 'name role')
      .populate('questions.responses.userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    polls.forEach(poll => {
      poll.isActive = new Date(poll.expiresAt) > now;
    });

    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch survey analytics', error: error.message });
  }
};

// Query users with filters (Admin only)
exports.queryUsers = async (req, res) => {
  try {
    const { name, email, role, isCsrUser, dateFrom, dateTo, hasPurchased, completionRange } = req.body;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query object
    let query = { role: 'user' };

    // Text search filters
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    // Role filter
    if (role && role !== 'all') {
      if (role === 'partner') {
        // Find users with role 'partner' OR any admin who has a partnerTier
        query.$or = [
          { role: 'partner' },
          { partnerTier: { $exists: true, $ne: null } }
        ];
        delete query.role;
      } else {
        query.role = role;
      }
    }

    // CSR user filter
    if (isCsrUser !== undefined && isCsrUser !== 'all') {
      query.isCsrUser = isCsrUser === 'yes';
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Has purchased modules filter
    if (hasPurchased && hasPurchased !== 'all') {
      if (hasPurchased === 'yes') {
        query.purchasedModules = { $exists: true, $ne: [] };
      } else {
        query.purchasedModules = { $size: 0 };
      }
    }

    // Execute query
    const users = await User.find(query)
      .select('name email role isCsrUser country partnerTier partnerAccessCode purchasedModules isSuspended createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get progress data for completion filter
    const usersWithProgress = await Promise.all(users.map(async (user) => {
      const userProgress = await Progress.find({ userId: user._id });
      
      let totalProgress = 0;
      if (userProgress.length > 0) {
        totalProgress = userProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / userProgress.length;
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isCsrUser: user.isCsrUser,
        country: user.country,
        partnerTier: user.partnerTier,
        partnerAccessCode: user.partnerAccessCode,
        purchasedModules: user.purchasedModules.length,
        overallProgress: Math.round(totalProgress),
        createdAt: user.createdAt
      };
    }));

    // Apply completion range filter
    let filteredUsers = usersWithProgress;
    if (completionRange && completionRange !== 'all') {
      if (completionRange === 'low') {
        filteredUsers = usersWithProgress.filter(u => u.overallProgress < 30);
      } else if (completionRange === 'medium') {
        filteredUsers = usersWithProgress.filter(u => u.overallProgress >= 30 && u.overallProgress < 70);
      } else if (completionRange === 'high') {
        filteredUsers = usersWithProgress.filter(u => u.overallProgress >= 70);
      }
    }

    const total = await User.countDocuments(query);

    res.json({
      users: filteredUsers,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to query users', error: error.message });
  }
};

// Suspend/Unsuspend user (Super Admin only)
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can suspend users' });
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Cannot suspend super admin users' });
    }

    targetUser.isSuspended = !targetUser.isSuspended;
    await targetUser.save();

    // If suspending, force logout the user via socket
    if (targetUser.isSuspended) {
      const io = req.app.get('io');
      if (io) {
        io.emit('user-suspended', { email: targetUser.email });
        console.log('Emitted user-suspended event for:', targetUser.email);
      }
    }

    res.json({
      message: `User ${targetUser.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isSuspended: targetUser.isSuspended
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to suspend user', error: error.message });
  }
};

// Delete user (Super Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can delete users' });
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'admin' || targetUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Force logout the user via socket before deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('user-suspended', { email: targetUser.email });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'User deleted permanently'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Toggle Help Desk access (Super Admin only)
exports.toggleHelpDeskAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can manage help desk access' });
    }

    const targetAdmin = await User.findById(id);

    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    targetAdmin.canAccessHelpDesk = !targetAdmin.canAccessHelpDesk;
    await targetAdmin.save();

    res.json({
      message: `Help desk access ${targetAdmin.canAccessHelpDesk ? 'granted' : 'revoked'} successfully`,
      admin: {
        id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        canAccessHelpDesk: targetAdmin.canAccessHelpDesk
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update help desk access', error: error.message });
  }
};
