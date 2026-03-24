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
router.delete('/admins/:id', auth, adminAuth, adminController.deleteAdmin);
router.put('/admins/:id/toggle-upload-access', auth, adminAuth, adminController.toggleContentUploadAccess);
router.get('/quiz-analytics', auth, adminAuth, adminController.getQuizAnalytics);
router.get('/quiz-analytics/export', auth, adminAuth, adminController.exportQuizData);
router.put('/admins/:id/toggle-analytics-access', auth, adminAuth, adminController.toggleQuizAnalyticsAccess);
router.put('/admins/:id/toggle-survey-analytics-access', auth, adminAuth, adminController.toggleSurveyAnalyticsAccess);
router.get('/survey-analytics', auth, adminAuth, adminController.getSurveyAnalytics);
router.post('/users/query', auth, adminAuth, adminController.queryUsers);
router.put('/users/:id/suspend', auth, adminAuth, adminController.suspendUser);
router.delete('/users/:id/delete', auth, adminAuth, adminController.deleteUser);

module.exports = router;
