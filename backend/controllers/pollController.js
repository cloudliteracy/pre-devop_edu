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
      .populate('options.votes', 'name')
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

// Create poll
exports.createPoll = async (req, res) => {
  try {
    const { question, options, duration } = req.body;

    if (!question || !options || options.length < 2 || options.length > 10) {
      return res.status(400).json({ message: 'Question and 2-10 options required' });
    }

    if (question.length > 200) {
      return res.status(400).json({ message: 'Question must be 200 characters or less' });
    }

    const invalidOptions = options.filter(opt => !opt.trim() || opt.length > 100);
    if (invalidOptions.length > 0) {
      return res.status(400).json({ message: 'Each option must be 1-100 characters' });
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
      question: question.trim(),
      options: options.map(opt => ({ text: opt.trim(), votes: [] })),
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

// Vote on poll
exports.votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (new Date() > poll.expiresAt) {
      return res.status(400).json({ message: 'Poll has expired' });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    // Check if user already voted
    const hasVoted = poll.options.some(opt => 
      opt.votes.some(v => v.toString() === req.user._id.toString())
    );

    if (hasVoted) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    poll.options[optionIndex].votes.push(req.user._id);
    await poll.save();
    await poll.populate('user', 'name role');
    await poll.populate('options.votes', 'name');

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
      return res.status(404).json({ message: 'Poll not found' });
    }

    const isOwner = poll.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this poll' });
    }

    await Poll.findByIdAndDelete(id);

    const io = req.app.get('io');
    io.emit('poll-deleted', { pollId: id });

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
