import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as pollService from '../services/polls';
import socketService from '../services/socket';
import './Polls.css';

const Polls = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('1d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPolls();
    setupSocketListeners();
    return () => socketService.offPollEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const data = await pollService.getPolls(activeTab);
      setPolls(data);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.onNewPoll((poll) => {
      if (activeTab === 'active') {
        setPolls(prev => [poll, ...prev]);
      }
    });

    socketService.onPollUpdated((updatedPoll) => {
      setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
    });

    socketService.onPollDeleted(({ pollId }) => {
      setPolls(prev => prev.filter(p => p._id !== pollId));
    });
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    try {
      await pollService.createPoll(question, validOptions, duration);
      setQuestion('');
      setOptions(['', '']);
      setDuration('1d');
      setShowCreateForm(false);
      alert('Poll created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating poll');
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      await pollService.votePoll(pollId, optionIndex);
    } catch (error) {
      alert(error.response?.data?.message || 'Error voting');
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;

    try {
      await pollService.deletePoll(pollId);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting poll');
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const hasUserVoted = (poll) => {
    if (!user) return false;
    const userId = user.userId || user.id || user._id;
    return poll.options.some(opt => opt.votes.some(v => v._id === userId || v === userId));
  };

  const getUserVote = (poll) => {
    if (!user) return -1;
    const userId = user.userId || user.id || user._id;
    return poll.options.findIndex(opt => opt.votes.some(v => v._id === userId || v === userId));
  };

  const getTotalVotes = (poll) => {
    return poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  };

  const getPercentage = (votes, total) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  const canDelete = (poll) => {
    if (!user) return false;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const userId = user.userId || user.id || user._id;
    const isOwner = poll.user && poll.user._id === userId;
    return isAdmin || isOwner;
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than 1h remaining';
  };

  return (
    <div className="polls-container">
      <div className="polls-header">
        <h1>Community Polls</h1>
        {user && (
          <button 
            className="create-poll-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✖ Cancel' : '➕ Create Poll'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreatePoll} className="create-poll-form">
          <h3>Create New Poll</h3>
          <input
            type="text"
            placeholder="Enter your question (max 200 characters)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
            required
          />
          
          <div className="poll-options">
            <label>Options (2-10):</label>
            {options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(index)}>✖</button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button type="button" onClick={addOption} className="add-option-btn">
                + Add Option
              </button>
            )}
          </div>

          <div className="poll-duration">
            <label>Duration:</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
              <option value="3d">3 Days</option>
              <option value="7d">7 Days</option>
            </select>
          </div>

          <button type="submit" className="submit-poll-btn">Create Poll</button>
        </form>
      )}

      <div className="polls-tabs">
        <button
          className={activeTab === 'active' ? 'active' : ''}
          onClick={() => setActiveTab('active')}
        >
          Active Polls
        </button>
        <button
          className={activeTab === 'expired' ? 'active' : ''}
          onClick={() => setActiveTab('expired')}
        >
          Expired Polls
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="no-polls">
          {activeTab === 'active' ? 'No active polls' : 'No expired polls'}
        </div>
      ) : (
        <div className="polls-list">
          {polls.map((poll) => {
            const totalVotes = getTotalVotes(poll);
            const userVoted = hasUserVoted(poll);
            const userVoteIndex = getUserVote(poll);
            const isExpired = new Date(poll.expiresAt) <= new Date();

            return (
              <div key={poll._id} className="poll-card">
                <div className="poll-header">
                  <div className="poll-info">
                    <span className="poll-author">{poll.user?.name || 'Unknown'}</span>
                    <span className="poll-time">
                      {isExpired ? 'Expired' : formatTimeRemaining(poll.expiresAt)}
                    </span>
                  </div>
                  {canDelete(poll) && (
                    <button 
                      className="delete-poll-btn"
                      onClick={() => handleDeletePoll(poll._id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <h3 className="poll-question">{poll.question}</h3>

                <div className="poll-options-list">
                  {poll.options.map((option, index) => {
                    const percentage = getPercentage(option.votes.length, totalVotes);
                    const isUserChoice = userVoteIndex === index;

                    return (
                      <div key={index} className="poll-option">
                        {!userVoted && !isExpired ? (
                          <button
                            className="vote-btn"
                            onClick={() => handleVote(poll._id, index)}
                          >
                            <span className="option-text">{option.text}</span>
                          </button>
                        ) : (
                          <div className="poll-result">
                            <div className="result-header">
                              <span className="option-text">
                                {option.text}
                                {isUserChoice && <span className="your-vote"> ✓ Your vote</span>}
                              </span>
                              <span className="vote-count">{percentage}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="votes-text">{option.votes.length} votes</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="poll-footer">
                  <span className="total-votes">{totalVotes} total votes</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Polls;
