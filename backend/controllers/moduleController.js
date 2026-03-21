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
