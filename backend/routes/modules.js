const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const auth = require('../middleware/auth');
const verifyAccess = require('../middleware/verifyAccess');

router.get('/', moduleController.getAllModules);
router.get('/:moduleId', auth, verifyAccess, moduleController.getModuleById);
router.post('/', moduleController.createModule);

module.exports = router;
