const Progress = require('../models/Progress');
const Module = require('../models/Module');
const QRCode = require('qrcode');

exports.trackProgress = async (req, res) => {
  try {
    const { moduleId, type, itemId } = req.body;
    const userId = req.user._id;

    let progress = await Progress.findOne({ userId, moduleId });

    if (!progress) {
      progress = new Progress({ userId, moduleId });
    }

    if (type === 'video' && !progress.videosWatched.includes(itemId)) {
      progress.videosWatched.push(itemId);
    } else if (type === 'pdf' && !progress.pdfsDownloaded.includes(itemId)) {
      progress.pdfsDownloaded.push(itemId);
    }

    progress.lastAccessedAt = Date.now();
    
    // Calculate completion percentage
    const module = await Module.findById(moduleId);
    const totalVideos = module.videos?.length || 0;
    const totalPdfs = module.pdfs?.length || 0;
    
    const videoProgress = totalVideos > 0 ? (progress.videosWatched.length / totalVideos) * 40 : 0;
    const pdfProgress = totalPdfs > 0 ? (progress.pdfsDownloaded.length / totalPdfs) * 30 : 0;
    const quizProgress = progress.quizCompleted ? 30 : 0;
    
    progress.completionPercentage = Math.round(videoProgress + pdfProgress + quizProgress);

    await progress.save();

    res.json({ 
      success: true, 
      progress,
      message: 'Progress updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to track progress', error: error.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user._id;

    let progress = await Progress.findOne({ userId, moduleId });

    if (!progress) {
      progress = new Progress({ 
        userId, 
        moduleId,
        videosWatched: [],
        pdfsDownloaded: [],
        quizCompleted: false,
        quizScore: 0,
        completionPercentage: 0
      });
    }

    const module = await Module.findById(moduleId);
    
    res.json({
      progress,
      totals: {
        videos: module.videos?.length || 0,
        pdfs: module.pdfs?.length || 0,
        hasQuiz: module.quiz?.questions?.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch progress', error: error.message });
  }
};

exports.updateQuizProgress = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { score } = req.body;
    const userId = req.user._id;

    let progress = await Progress.findOne({ userId, moduleId });

    if (!progress) {
      progress = new Progress({ userId, moduleId });
    }

    progress.quizCompleted = true;
    progress.quizScore = score;
    progress.lastAccessedAt = Date.now();

    // Recalculate completion percentage
    const module = await Module.findById(moduleId);
    const totalVideos = module.videos?.length || 0;
    const totalPdfs = module.pdfs?.length || 0;
    
    const videoProgress = totalVideos > 0 ? (progress.videosWatched.length / totalVideos) * 40 : 0;
    const pdfProgress = totalPdfs > 0 ? (progress.pdfsDownloaded.length / totalPdfs) * 30 : 0;
    const quizProgress = 30;
    
    progress.completionPercentage = Math.round(videoProgress + pdfProgress + quizProgress);

    await progress.save();

    res.json({ 
      success: true, 
      progress,
      message: 'Quiz progress updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quiz progress', error: error.message });
  }
};

exports.markVideoComplete = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user._id;

    let progress = await Progress.findOne({ userId, moduleId });

    if (!progress) {
      progress = new Progress({ userId, moduleId });
    }

    progress.videoCompleted = true;
    progress.lastAccessedAt = Date.now();
    await progress.save();

    res.json({ 
      success: true, 
      progress,
      message: 'Video marked as complete' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark video complete', error: error.message });
  }
};

exports.markMarkdownViewed = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user._id;

    let progress = await Progress.findOne({ userId, moduleId });

    if (!progress) {
      progress = new Progress({ userId, moduleId });
    }

    progress.markdownViewed = true;
    progress.lastAccessedAt = Date.now();
    await progress.save();

    res.json({ 
      success: true, 
      progress,
      message: 'Practice content marked as viewed' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark markdown viewed', error: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    const module = await Module.findById(moduleId);
    if (!module || !module.quiz || !module.quiz.questions.length) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let progress = await Progress.findOne({ userId, moduleId });
    if (!progress) {
      progress = new Progress({ userId, moduleId });
    }

    // Calculate score
    let correctCount = 0;
    const questionsWithAnswers = module.quiz.questions.map((q, index) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: answers[index]
    }));

    questionsWithAnswers.forEach((q) => {
      if (q.userAnswer === q.correctAnswer) correctCount++;
    });

    const score = Math.round((correctCount / module.quiz.questions.length) * 100);
    const passed = score >= module.quiz.passingScore;

    // Generate certificate ID if passed and first time passing
    let certificateId = null;
    if (passed && !progress.quizCompleted) {
      certificateId = `CL-${moduleId.toString().slice(-6)}-${userId.toString().slice(-6)}-${Date.now()}`;
    }

    // Store attempt
    progress.quizAttempts.push({
      questions: questionsWithAnswers,
      score,
      passed,
      certificateId,
      attemptedAt: new Date()
    });

    // Update progress if passed
    if (passed) {
      progress.quizCompleted = true;
      progress.quizScore = Math.max(progress.quizScore, score);
    }

    progress.lastAccessedAt = Date.now();
    await progress.save();

    // Check if next module unlocked
    const nextModule = await Module.findOne({ order: module.order + 1 });
    const nextModuleUnlocked = passed && nextModule ? true : false;

    res.json({
      success: true,
      score,
      passed,
      correctCount,
      totalQuestions: module.quiz.questions.length,
      passingScore: module.quiz.passingScore,
      certificateId,
      questionsWithAnswers,
      nextModuleUnlocked,
      nextModuleId: nextModule?._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit quiz', error: error.message });
  }
};

exports.generateCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({
      userId,
      'quizAttempts.certificateId': certificateId
    }).populate('moduleId');

    if (!progress) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const attempt = progress.quizAttempts.find(a => a.certificateId === certificateId);
    const module = progress.moduleId;

    // Generate QR code
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificateId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    res.json({
      success: true,
      certificate: {
        certificateId,
        userName: req.user.name,
        userEmail: req.user.email,
        moduleName: module.title,
        score: attempt.score,
        completedDate: attempt.attemptedAt,
        qrCode: qrCodeDataUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate certificate', error: error.message });
  }
};
