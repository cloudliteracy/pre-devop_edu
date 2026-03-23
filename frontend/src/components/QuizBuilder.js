import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuizBuilder.css';

const QuizBuilder = ({ moduleId, onClose, onSave }) => {
  const [questions, setQuestions] = useState([]);
  const [passingScore, setPassingScore] = useState(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExistingQuiz();
  }, [moduleId]);

  const loadExistingQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.quiz && response.data.quiz.questions) {
        setQuestions(response.data.quiz.questions);
        setPassingScore(response.data.quiz.passingScore || 70);
      } else {
        // Initialize with one empty question
        addQuestion();
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      addQuestion();
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      alert('Quiz must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is empty`);
        return;
      }
      const emptyOptions = q.options.filter(opt => !opt.trim());
      if (emptyOptions.length > 0) {
        alert(`Question ${i + 1} has empty options`);
        return;
      }
    }

    if (passingScore < 0 || passingScore > 100) {
      alert('Passing score must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/modules/${moduleId}/quiz`, {
        questions,
        passingScore
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Quiz saved successfully!');
      onSave();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="quiz-builder-loading">Loading quiz...</div>;
  }

  return (
    <div className="quiz-builder-overlay" onClick={onClose}>
      <div className="quiz-builder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quiz-builder-header">
          <h2>Quiz Builder</h2>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="quiz-builder-content">
          {/* Passing Score */}
          <div className="passing-score-section">
            <label>Passing Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value))}
              className="passing-score-input"
            />
          </div>

          {/* Questions */}
          <div className="questions-list">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="question-card">
                <div className="question-header">
                  <h3>Question {qIndex + 1}</h3>
                  <button 
                    className="remove-question-btn"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    🗑️ Remove
                  </button>
                </div>

                <div className="question-input-group">
                  <label>Question Text</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Enter your question here..."
                    rows={3}
                    className="question-textarea"
                  />
                </div>

                <div className="options-section">
                  <label>Options (Select the correct answer)</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-input-group">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={question.correctAnswer === oIndex}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                        className="correct-radio"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        className="option-input"
                      />
                      <span className="option-label">
                        {String.fromCharCode(65 + oIndex)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <button className="add-question-btn" onClick={addQuestion}>
            ➕ Add Question
          </button>
        </div>

        <div className="quiz-builder-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="save-quiz-btn" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;
