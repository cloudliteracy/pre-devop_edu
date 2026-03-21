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
router.post('/create-admin', auth, adminAuth, adminController.createAdmin);
router.get('/admins', auth, adminAuth, adminController.getAllAdmins);
router.put('/admins/:id/toggle-suspension', auth, adminAuth, adminController.toggleAdminSuspension);

module.exports = router;
