import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as pollService from '../services/polls';
import socketService from '../services/socket';
import QuestionAnalytics from '../components/QuestionAnalytics';
import ThankYouModal from '../components/ThankYouModal';
import './Polls.css';

const Polls = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{
    questionText: '',
    questionType: 'single',
    isRequired: false,
    options: ['', '']
  }]);
  const [duration, setDuration] = useState('1d');
  const [loading, setLoading] = useState(false);
  const [expandedSurveys, setExpandedSurveys] = useState({});
  const [showThankYou, setShowThankYou] = useState(false);

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
      console.error('Error loading surveys:', error);
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

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a survey title');
      return;
    }

    const validQuestions = questions.filter(q => q.questionText.trim());
    if (validQuestions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    try {
      if (editingPoll) {
        await pollService.updatePoll(editingPoll._id, title, validQuestions);
        alert('Survey updated successfully!');
        setEditingPoll(null);
      } else {
        await pollService.createPoll(title, validQuestions, duration);
        alert('Survey created successfully!');
      }
      setTitle('');
      setQuestions([{ questionText: '', questionType: 'single', isRequired: false, options: ['', ''] }]);
      setDuration('1d');
      setShowCreateForm(false);
    } catch (error) {
      alert(error.response?.data?.message || `Error ${editingPoll ? 'updating' : 'creating'} survey`);
    }
  };

  const handleSubmitResponse = async (pollId, responses) => {
    if (!user) {
      alert('Please login to respond');
      return;
    }

    try {
      await pollService.votePoll(pollId, responses);
      setShowThankYou(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting response');
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return;

    try {
      await pollService.deletePoll(pollId);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting survey');
    }
  };

  const handleEditPoll = (poll) => {
    const hasResponses = poll.questions.some(q => q.responses.length > 0);
    if (hasResponses) {
      const totalResponses = poll.questions[0].responses.length;
      alert(`Cannot edit survey - ${totalResponses} response${totalResponses !== 1 ? 's' : ''} received`);
      return;
    }

    setEditingPoll(poll);
    setTitle(poll.title);
    setQuestions(poll.questions.map(q => ({
      questionText: q.questionText,
      questionType: q.questionType,
      isRequired: q.isRequired || false,
      options: q.options.map(opt => opt.text)
    })));
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingPoll(null);
    setTitle('');
    setQuestions([{ questionText: '', questionType: 'single', isRequired: false, options: ['', ''] }]);
    setDuration('1d');
    setShowCreateForm(false);
  };

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', questionType: 'single', isRequired: false, options: ['', ''] }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    
    // Reset options when changing to open-ended
    if (field === 'questionType' && value === 'open') {
      newQuestions[index].options = [];
    } else if (field === 'questionType' && newQuestions[index].options.length === 0) {
      newQuestions[index].options = ['', ''];
    }
    
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length < 10) {
      newQuestions[questionIndex].options.push('');
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length > 2) {
      newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
      setQuestions(newQuestions);
    }
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const hasUserResponded = (poll) => {
    if (!user || !poll.questions || poll.questions.length === 0) return false;
    const userId = user.userId || user.id || user._id;
    return poll.questions[0].responses.some(r => r.userId._id === userId || r.userId === userId);
  };

  const canDelete = (poll) => {
    if (!user) return false;
    const isAdmin = user.role === 'admin' || user.isSuperAdmin;
    const userId = user.userId || user.id || user._id;
    const isOwner = poll.user && poll.user._id === userId;
    return isAdmin || isOwner;
  };

  const canEdit = (poll) => {
    if (!user) return false;
    const isAdmin = user.role === 'admin' || user.isSuperAdmin;
    const userId = user.userId || user.id || user._id;
    const isOwner = poll.user && poll.user._id === userId;
    return isAdmin || isOwner;
  };

  const canViewAnalytics = (poll) => {
    if (!user) return false;
    const isAdmin = user.role === 'admin' || user.isSuperAdmin;
    return isAdmin;
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

  const toggleSurveyExpansion = (pollId) => {
    setExpandedSurveys(prev => ({
      ...prev,
      [pollId]: !prev[pollId]
    }));
  };

  return (
    <div className="polls-container">
      {showThankYou && <ThankYouModal onClose={() => setShowThankYou(false)} />}
      <div className="polls-header">
        <h1>Community Surveys</h1>
        {user && (user.role === 'admin' || user.isSuperAdmin) && (
          <button 
            className="create-poll-btn"
            onClick={() => {
              if (showCreateForm && editingPoll) {
                cancelEdit();
              } else {
                setShowCreateForm(!showCreateForm);
              }
            }}
          >
            {showCreateForm ? '✖ Cancel' : '➕ Create Survey'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateSurvey} className="create-poll-form">
          <h3>{editingPoll ? 'Edit Survey' : 'Create New Survey'}</h3>
          <input
            type="text"
            placeholder="Survey Title (max 200 characters)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="survey-title-input"
          />
          
          <div className="questions-builder">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="question-builder">
                <div className="question-header">
                  <h4>Question {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qIndex)} className="remove-question-btn">
                      ✖ Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Enter question text"
                  value={question.questionText}
                  onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                  maxLength={300}
                  required
                />

                <div className="question-type-selector">
                  <label>Question Type:</label>
                  <select 
                    value={question.questionType}
                    onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                  >
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                    <option value="open">Open-Ended</option>
                  </select>
                </div>

                <div className="required-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={question.isRequired || false}
                      onChange={(e) => updateQuestion(qIndex, 'isRequired', e.target.checked)}
                    />
                    <span className="toggle-text">Required Question</span>
                  </label>
                </div>

                {question.questionType !== 'open' && (
                  <div className="poll-options">
                    <label>Options (2-10):</label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-input">
                        <input
                          type="text"
                          placeholder={`Option ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          maxLength={150}
                        />
                        {question.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(qIndex, oIndex)}>✖</button>
                        )}
                      </div>
                    ))}
                    {question.options.length < 10 && (
                      <button type="button" onClick={() => addOption(qIndex)} className="add-option-btn">
                        + Add Option
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="add-question-btn">
              + Add Question
            </button>
          </div>

          <div className="poll-duration">
            <label>Duration:</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} disabled={editingPoll}>
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
              <option value="3d">3 Days</option>
              <option value="7d">7 Days</option>
            </select>
          </div>

          <button type="submit" className="submit-poll-btn">{editingPoll ? 'Update Survey' : 'Create Survey'}</button>
        </form>
      )}

      <div className="polls-tabs">
        <button
          className={activeTab === 'active' ? 'active' : ''}
          onClick={() => setActiveTab('active')}
        >
          Active Surveys
        </button>
        <button
          className={activeTab === 'expired' ? 'active' : ''}
          onClick={() => setActiveTab('expired')}
        >
          Expired Surveys
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading surveys...</div>
      ) : polls.length === 0 ? (
        <div className="no-polls">
          {activeTab === 'active' ? 'No active surveys' : 'No expired surveys'}
        </div>
      ) : (
        <div className="polls-list">
          {polls.map((poll) => {
            const userResponded = hasUserResponded(poll);
            const isExpired = new Date(poll.expiresAt) <= new Date();
            const isExpanded = expandedSurveys[poll._id];

            return (
              <SurveyCard
                key={poll._id}
                poll={poll}
                user={user}
                userResponded={userResponded}
                isExpired={isExpired}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleSurveyExpansion(poll._id)}
                onSubmit={handleSubmitResponse}
                onDelete={handleDeletePoll}
                onEdit={handleEditPoll}
                canDelete={canDelete(poll)}
                canEdit={canEdit(poll)}
                canViewAnalytics={canViewAnalytics(poll)}
                formatTimeRemaining={formatTimeRemaining}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Survey Card Component
const SurveyCard = ({ poll, user, userResponded, isExpired, isExpanded, onToggleExpand, onSubmit, onDelete, onEdit, canDelete, canEdit, canViewAnalytics, formatTimeRemaining }) => {
  const [responses, setResponses] = useState({});

  const handleAnswerChange = (questionIndex, answer) => {
    setResponses(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = () => {
    const responseArray = poll.questions.map((q, index) => ({
      questionIndex: index,
      answer: responses[index]
    }));

    // Validate required questions answered
    const unansweredRequired = poll.questions.filter((q, index) => {
      if (!q.isRequired) return false;
      
      if (q.questionType === 'open') {
        return !responses[index] || !responses[index].trim();
      }
      if (q.questionType === 'multiple') {
        return !responses[index] || responses[index].length === 0;
      }
      return responses[index] === undefined;
    });

    if (unansweredRequired.length > 0) {
      alert(`Please answer all required questions (${unansweredRequired.length} remaining)`);
      return;
    }

    onSubmit(poll._id, responseArray);
  };

  return (
    <div className="poll-card survey-card">
      <div className="poll-header">
        <div className="poll-info">
          <span className="poll-author">{poll.user?.name || 'Unknown'}</span>
          <span className="poll-time">
            {isExpired ? 'Expired' : formatTimeRemaining(poll.expiresAt)}
          </span>
        </div>
        <div className="poll-actions">
          {canEdit && (
            <button 
              className="edit-poll-btn"
              onClick={() => onEdit(poll)}
              title="Edit survey"
            >
              ✏️
            </button>
          )}
          {canDelete && (
            <button 
              className="delete-poll-btn"
              onClick={() => onDelete(poll._id)}
              title="Delete survey"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <h3 className="poll-question survey-title">{poll.title}</h3>
      <p className="survey-meta">{poll.questions?.length || 0} Question{poll.questions?.length !== 1 ? 's' : ''}</p>

      {!userResponded && !isExpired ? (
        <div className="survey-response-form">
          {poll.questions.map((question, qIndex) => (
            <div key={qIndex} className="survey-question">
              <h4 className="question-text">
                Q{qIndex + 1}: {question.questionText}
                {question.isRequired && <span className="required-asterisk"> *</span>}
              </h4>
              <div className="question-badges">
                <span className="question-type-badge">
                  {question.questionType === 'single' ? 'Single Choice' : question.questionType === 'multiple' ? 'Multiple Choice' : 'Open-Ended'}
                </span>
                {question.isRequired && <span className="required-badge">Required</span>}
              </div>

              {question.questionType === 'single' && (
                <div className="question-options">
                  {question.options.map((option, oIndex) => (
                    <label key={oIndex} className="option-label">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={responses[qIndex] === oIndex}
                        onChange={() => handleAnswerChange(qIndex, oIndex)}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.questionType === 'multiple' && (
                <div className="question-options">
                  {question.options.map((option, oIndex) => (
                    <label key={oIndex} className="option-label">
                      <input
                        type="checkbox"
                        checked={Array.isArray(responses[qIndex]) && responses[qIndex].includes(oIndex)}
                        onChange={(e) => {
                          const current = responses[qIndex] || [];
                          const newValue = e.target.checked
                            ? [...current, oIndex]
                            : current.filter(i => i !== oIndex);
                          handleAnswerChange(qIndex, newValue);
                        }}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.questionType === 'open' && (
                <textarea
                  className="open-response-input"
                  placeholder="Type your response here..."
                  value={responses[qIndex] || ''}
                  onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                  rows={4}
                />
              )}
            </div>
          ))}

          <button onClick={handleSubmit} className="submit-response-btn">
            Submit Response
          </button>
        </div>
      ) : (
        <div className="survey-analytics-section">
          {/* Analytics removed from public page - only in admin dashboard */}
        </div>
      )}
    </div>
  );
};

export default Polls;
