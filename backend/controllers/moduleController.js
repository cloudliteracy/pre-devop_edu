const Module = require('../models/Module');

exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.find().select('-quiz').sort('order');
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching modules', error: error.message });
  }
};

exports.getModuleById = async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching module', error: error.message });
  }
};

exports.createModule = async (req, res) => {
  try {
    const module = new Module(req.body);
    await module.save();
    res.status(201).json(module);
  } catch (error) {
    res.status(500).json({ message: 'Error creating module', error: error.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { questions, passingScore } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'Quiz must have at least one question' });
    }

    if (passingScore < 0 || passingScore > 100) {
      return res.status(400).json({ message: 'Passing score must be between 0 and 100' });
    }

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    module.quiz = {
      questions,
      passingScore
    };

    await module.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz: module.quiz
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating quiz', error: error.message });
  }
};
