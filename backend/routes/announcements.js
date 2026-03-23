const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public route
router.get('/active', announcementController.getActiveAnnouncement);

// Admin routes
router.get('/', auth, adminAuth, announcementController.getAllAnnouncements);
router.post('/', auth, adminAuth, announcementController.createAnnouncement);
router.put('/:id', auth, adminAuth, announcementController.updateAnnouncement);
router.delete('/:id', auth, adminAuth, announcementController.deleteAnnouncement);
router.put('/admin/:id/toggle-access', auth, adminAuth, announcementController.toggleAnnouncementAccess);

module.exports = router;
