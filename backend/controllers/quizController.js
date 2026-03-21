const Module = require('../models/Module');
const User = require('../models/User');

exports.getQuiz = async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId).select('quiz');
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const quizWithoutAnswers = {
      questions: module.quiz.questions.map(q => ({
        question: q.question,
        options: q.options
      })),
      passingScore: module.quiz.passingScore
    };

    res.json(quizWithoutAnswers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { answers } = req.body;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    let correctCount = 0;
    module.quiz.questions.forEach((q, index) => {
      if (q.correctAnswer === answers[index]) correctCount++;
    });

    const score = (correctCount / module.quiz.questions.length) * 100;
    const passed = score >= module.quiz.passingScore;

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        quizScores: {
          moduleId,
          score,
          completedAt: new Date()
        }
      }
    });

    res.json({ score, passed, correctCount, totalQuestions: module.quiz.questions.length });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
};
