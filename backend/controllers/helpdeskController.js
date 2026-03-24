const HelpDeskChat = require('../models/HelpDeskChat');
const { v4: uuidv4 } = require('uuid');

// Create new chat session
exports.createSession = async (req, res) => {
  try {
    const { userType, guestName, guestEmail } = req.body;
    
    const sessionId = uuidv4();
    
    const chatData = {
      sessionId,
      userType,
      status: 'waiting'
    };

    if (userType === 'guest') {
      chatData.guestName = guestName;
      chatData.guestEmail = guestEmail;
    } else {
      chatData.userId = req.user._id;
    }

    const chat = await HelpDeskChat.create(chatData);
    
    // Notify admins via socket
    const io = req.app.get('io');
    io.emit('helpdesk:new-request', {
      sessionId: chat.sessionId,
      userType: chat.userType,
      userName: userType === 'guest' ? guestName : req.user.name,
      startedAt: chat.startedAt
    });

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get chat session
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chat = await HelpDeskChat.findOne({ sessionId })
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .populate('messages.senderId', 'name');

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin joins chat
exports.joinChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chat = await HelpDeskChat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (chat.status === 'active' && chat.adminId) {
      return res.status(400).json({ 
        message: 'Chat already claimed by another admin',
        adminName: chat.adminId.name
      });
    }

    chat.adminId = req.user._id;
    chat.status = 'active';
    await chat.save();

    await chat.populate('userId', 'name email');
    await chat.populate('adminId', 'name email');

    // Notify user that admin joined
    const io = req.app.get('io');
    io.to(sessionId).emit('helpdesk:admin-joined', {
      adminName: req.user.name,
      adminId: req.user._id
    });

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { encryptedContent, senderType } = req.body;
    
    const chat = await HelpDeskChat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (chat.status === 'closed') {
      return res.status(400).json({ message: 'Chat session is closed' });
    }

    const message = {
      senderId: req.user ? req.user._id : null,
      senderType,
      encryptedContent,
      timestamp: new Date()
    };

    chat.messages.push(message);
    await chat.save();

    await chat.populate('messages.senderId', 'name');

    // Emit message via socket
    const io = req.app.get('io');
    io.to(sessionId).emit('helpdesk:new-message', {
      message: chat.messages[chat.messages.length - 1],
      sessionId
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Close chat session
exports.closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chat = await HelpDeskChat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    chat.status = 'closed';
    chat.closedAt = new Date();
    chat.closedBy = req.user._id;
    await chat.save();

    // Notify participants
    const io = req.app.get('io');
    io.to(sessionId).emit('helpdesk:session-closed', {
      sessionId,
      closedBy: req.user.name
    });

    res.json({ message: 'Chat session closed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all active sessions (admin only)
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await HelpDeskChat.find({ status: { $in: ['waiting', 'active'] } })
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .sort({ startedAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get chat history (admin only)
exports.getChatHistory = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const sessions = await HelpDeskChat.find({ status: 'closed' })
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .sort({ closedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await HelpDeskChat.countDocuments({ status: 'closed' });

    res.json({ sessions, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
