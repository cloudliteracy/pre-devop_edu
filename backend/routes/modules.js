const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const auth = require('../middleware/auth');
const verifyAccess = require('../middleware/verifyAccess');
const contentUploadAuth = require('../middleware/contentUploadAuth');

router.get('/', moduleController.getAllModules);
router.get('/:moduleId', auth, verifyAccess, moduleController.getModuleById);
router.post('/', moduleController.createModule);
router.put('/:moduleId/quiz', auth, contentUploadAuth, moduleController.updateQuiz);

module.exports = router;
