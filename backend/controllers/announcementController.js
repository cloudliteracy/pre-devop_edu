const Announcement = require('../models/Announcement');

// Get active announcement
exports.getActiveAnnouncement = async (req, res) => {
  try {
    const now = new Date();
    const announcement = await Announcement.findOne({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcement', error: error.message });
  }
};

// Get all announcements (admin only)
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcementData = {
      title,
      content,
      createdBy: req.user._id,
      expiresAt: expiresAt || null
    };

    const announcement = new Announcement(announcementData);
    await announcement.save();
    await announcement.populate('createdBy', 'name');

    const io = req.app.get('io');
    if (io) {
      io.emit('new-announcement', announcement);
    }

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isActive, expiresAt } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (typeof isActive !== 'undefined') announcement.isActive = isActive;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt;

    await announcement.save();
    await announcement.populate('createdBy', 'name');

    const io = req.app.get('io');
    if (io) {
      io.emit('announcement-updated', announcement);
    }

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update announcement', error: error.message });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('announcement-deleted', { announcementId: id });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
};

// Toggle announcement access for admin
exports.toggleAnnouncementAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({ message: 'Only super admin can manage announcement permissions' });
    }

    const User = require('../models/User');
    const targetAdmin = await User.findById(id);

    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    targetAdmin.canManageAnnouncements = !targetAdmin.canManageAnnouncements;
    await targetAdmin.save();

    res.json({
      message: `Announcement management access ${targetAdmin.canManageAnnouncements ? 'granted' : 'revoked'} successfully`,
      admin: {
        id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        canManageAnnouncements: targetAdmin.canManageAnnouncements
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update announcement access', error: error.message });
  }
};
