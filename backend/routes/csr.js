const express = require('express');
const router = express.Router();
const csrController = require('../controllers/csrController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public route
router.post('/verify', csrController.verifyCode);

// Super admin routes
router.post('/generate', auth, adminAuth, csrController.generateCode);
router.get('/codes', auth, adminAuth, csrController.getAllCodes);
router.put('/codes/:id/toggle', auth, adminAuth, csrController.toggleCodeStatus);
router.delete('/codes/:id', auth, adminAuth, csrController.deleteCode);
router.get('/analytics', auth, adminAuth, csrController.getAnalytics);
router.put('/users/:userId/renew', auth, adminAuth, csrController.renewCsrAccess);
router.delete('/users/:userId/expel', auth, adminAuth, csrController.expelCsrUser);

module.exports = router;
