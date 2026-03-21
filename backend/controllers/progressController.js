const Progress = require('../models/Progress');
const Module = require('../models/Module');

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
