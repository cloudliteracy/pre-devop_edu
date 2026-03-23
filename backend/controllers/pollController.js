const Poll = require('../models/Poll');

// Get all polls
exports.getPolls = async (req, res) => {
  try {
    const { status } = req.query;
    const now = new Date();
    
    let query = {};
    if (status === 'active') {
      query.expiresAt = { $gt: now };
    } else if (status === 'expired') {
      query.expiresAt = { $lte: now };
    }

    const polls = await Poll.find(query)
      .populate('user', 'name role')
      .populate('questions.responses.userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Update isActive status
    polls.forEach(poll => {
      poll.isActive = new Date(poll.expiresAt) > now;
    });

    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create survey/poll
exports.createPoll = async (req, res) => {
  try {
    const { title, questions, duration } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Only admins can create surveys' });
    }

    if (!title || !questions || questions.length < 1) {
      return res.status(400).json({ message: 'Title and at least 1 question required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Title must be 200 characters or less' });
    }

    // Validate questions
    for (const q of questions) {
      if (!q.questionText || !q.questionType) {
        return res.status(400).json({ message: 'Each question must have text and type' });
      }
      
      if (q.questionText.length > 300) {
        return res.status(400).json({ message: 'Question text must be 300 characters or less' });
      }

      if (q.questionType === 'single' || q.questionType === 'multiple') {
        if (!q.options || q.options.length < 2 || q.options.length > 10) {
          return res.status(400).json({ message: 'Choice questions need 2-10 options' });
        }
      }
    }

    const expiresAt = new Date();
    switch (duration) {
      case '1h':
        expiresAt.setHours(expiresAt.getHours() + 1);
        break;
      case '1d':
        expiresAt.setDate(expiresAt.getDate() + 1);
        break;
      case '3d':
        expiresAt.setDate(expiresAt.getDate() + 3);
        break;
      case '7d':
        expiresAt.setDate(expiresAt.getDate() + 7);
        break;
      default:
        expiresAt.setDate(expiresAt.getDate() + 1);
    }

    const poll = new Poll({
      user: req.user._id,
      title: title.trim(),
      questions: questions.map(q => ({
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        isRequired: q.isRequired || false,
        options: q.options ? q.options.map(opt => ({ text: opt.trim() })) : [],
        responses: []
      })),
      expiresAt
    });

    await poll.save();
    await poll.populate('user', 'name role');

    const io = req.app.get('io');
    io.emit('new-poll', poll);

    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update survey/poll
exports.updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, questions } = req.body;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    const isOwner = poll.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.isSuperAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this survey' });
    }

    // Check if survey has responses
    const hasResponses = poll.questions.some(q => q.responses.length > 0);
    if (hasResponses) {
      return res.status(400).json({ message: 'Cannot edit survey that has responses' });
    }

    if (!title || !questions || questions.length < 1) {
      return res.status(400).json({ message: 'Title and at least 1 question required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Title must be 200 characters or less' });
    }

    // Validate questions
    for (const q of questions) {
      if (!q.questionText || !q.questionType) {
        return res.status(400).json({ message: 'Each question must have text and type' });
      }
      
      if (q.questionText.length > 300) {
        return res.status(400).json({ message: 'Question text must be 300 characters or less' });
      }

      if (q.questionType === 'single' || q.questionType === 'multiple') {
        if (!q.options || q.options.length < 2 || q.options.length > 10) {
          return res.status(400).json({ message: 'Choice questions need 2-10 options' });
        }
      }
    }

    poll.title = title.trim();
    poll.questions = questions.map(q => ({
      questionText: q.questionText.trim(),
      questionType: q.questionType,
      isRequired: q.isRequired || false,
      options: q.options ? q.options.map(opt => ({ text: opt.trim() })) : [],
      responses: []
    }));

    await poll.save();
    await poll.populate('user', 'name role');

    const io = req.app.get('io');
    io.emit('poll-updated', poll);

    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit survey response
exports.votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { responses } = req.body; // Array of { questionIndex, answer }

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    if (new Date() > poll.expiresAt) {
      return res.status(400).json({ message: 'Survey has expired' });
    }

    // Check if user already responded
    const hasResponded = poll.questions.some(q => 
      q.responses.some(r => r.userId.toString() === req.user._id.toString())
    );

    if (hasResponded) {
      return res.status(400).json({ message: 'You have already responded to this survey' });
    }

    // Add responses to each question
    responses.forEach(({ questionIndex, answer }) => {
      if (questionIndex >= 0 && questionIndex < poll.questions.length) {
        poll.questions[questionIndex].responses.push({
          userId: req.user._id,
          answer,
          timestamp: new Date()
        });
      }
    });

    await poll.save();
    await poll.populate('user', 'name role');
    await poll.populate('questions.responses.userId', 'name');

    const io = req.app.get('io');
    io.emit('poll-updated', poll);

    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete poll
exports.deletePoll = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    const isOwner = poll.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.isSuperAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this survey' });
    }

    await Poll.findByIdAndDelete(id);

    const io = req.app.get('io');
    io.emit('poll-deleted', { pollId: id });

    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
