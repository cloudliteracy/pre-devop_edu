const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const primarySuperAdminOnly = require('../middleware/primarySuperAdminOnly');

// Public route
router.get('/active', announcementController.getActiveAnnouncement);

// Admin routes
router.get('/', auth, adminAuth, announcementController.getAllAnnouncements);
router.get('/my', auth, adminAuth, announcementController.getMyAnnouncements);
router.post('/', auth, adminAuth, announcementController.createAnnouncement);
router.put('/:id', auth, adminAuth, announcementController.updateAnnouncement);
router.delete('/:id', auth, adminAuth, announcementController.deleteAnnouncement);
router.put('/admin/:id/toggle-access', auth, adminAuth, announcementController.toggleAnnouncementAccess);

// Primary Super Admin only routes
router.get('/pending', auth, primarySuperAdminOnly, announcementController.getPendingAnnouncements);
router.post('/:id/approve', auth, primarySuperAdminOnly, announcementController.approveAnnouncement);
router.post('/:id/reject', auth, primarySuperAdminOnly, announcementController.rejectAnnouncement);

module.exports = router;
