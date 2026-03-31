const Announcement = require('../models/Announcement');

// Get active announcement
exports.getActiveAnnouncement = async (req, res) => {
  try {
    const now = new Date();
    const announcement = await Announcement.findOne({
      isActive: true,
      status: 'approved', // Only show approved announcements to public
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
    const query = {};
    
    // If not primary super admin, only show approved announcements and own pending ones
    if (!req.user.isPrimarySuperAdmin) {
      query.$or = [
        { status: 'approved' },
        { createdBy: req.user._id, status: 'pending' }
      ];
    }
    
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
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
      expiresAt: expiresAt || null,
      // Primary super admin announcements are auto-approved
      status: req.user.isPrimarySuperAdmin ? 'approved' : 'pending'
    };

    const announcement = new Announcement(announcementData);
    await announcement.save();
    await announcement.populate('createdBy', 'name');

    // Only emit to public if approved
    if (announcement.status === 'approved') {
      const io = req.app.get('io');
      if (io) {
        io.emit('new-announcement', announcement);
      }
    }

    res.status(201).json({
      announcement,
      message: announcement.status === 'pending' 
        ? 'Announcement created and pending approval from primary super admin'
        : 'Announcement created and published'
    });
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

// Get my announcements
exports.getMyAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch my announcements', error: error.message });
  }
};

// Get pending announcements (Primary Super Admin only)
exports.getPendingAnnouncements = async (req, res) => {
  try {
    if (!req.user.isPrimarySuperAdmin) {
      return res.status(403).json({ message: 'Only primary super admin can view pending announcements' });
    }

    // Get pending announcements from OTHER users (not the primary super admin themselves)
    const announcements = await Announcement.find({ 
      status: 'pending',
      createdBy: { $ne: req.user._id } // Exclude own announcements
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending announcements', error: error.message });
  }
};

// Approve announcement (Primary Super Admin only)
exports.approveAnnouncement = async (req, res) => {
  try {
    if (!req.user.isPrimarySuperAdmin) {
      return res.status(403).json({ message: 'Only primary super admin can approve announcements' });
    }

    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.status !== 'pending') {
      return res.status(400).json({ message: 'Announcement is not pending approval' });
    }

    announcement.status = 'approved';
    announcement.approvedBy = req.user._id;
    announcement.approvedAt = new Date();
    await announcement.save();
    await announcement.populate('createdBy', 'name');
    await announcement.populate('approvedBy', 'name');

    // Emit to public
    const io = req.app.get('io');
    if (io) {
      io.emit('new-announcement', announcement);
    }

    res.json({ message: 'Announcement approved successfully', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve announcement', error: error.message });
  }
};

// Reject announcement (Primary Super Admin only)
exports.rejectAnnouncement = async (req, res) => {
  try {
    if (!req.user.isPrimarySuperAdmin) {
      return res.status(403).json({ message: 'Only primary super admin can reject announcements' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.status !== 'pending') {
      return res.status(400).json({ message: 'Announcement is not pending approval' });
    }

    announcement.status = 'rejected';
    announcement.approvedBy = req.user._id;
    announcement.approvedAt = new Date();
    announcement.rejectionReason = reason || 'No reason provided';
    await announcement.save();
    await announcement.populate('createdBy', 'name');
    await announcement.populate('approvedBy', 'name');

    res.json({ message: 'Announcement rejected', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject announcement', error: error.message });
  }
};
