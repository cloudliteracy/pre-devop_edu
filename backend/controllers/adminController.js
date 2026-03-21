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

    const count = await User.countDocuments(query);

    res.json({
      users,
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
