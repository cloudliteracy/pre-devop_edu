const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/stats', auth, adminAuth, adminController.getDashboardStats);
router.get('/users', auth, adminAuth, adminController.getAllUsers);
router.get('/users/:id', auth, adminAuth, adminController.getUserDetails);
router.get('/modules/analytics', auth, adminAuth, adminController.getModuleAnalytics);
router.get('/activity', auth, adminAuth, adminController.getRecentActivity);

module.exports = router;
