import React, { useState } from 'react';
import './QuizTaking.css';

const QuizTaking = ({ quiz, moduleId, onQuizComplete }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quiz.questions.length) {
      alert('Please answer all questions before submitting');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/progress/${moduleId}/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: Object.values(answers) })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        setSubmitted(true);
        onQuizComplete(data);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  if (submitted && result) {
    return (
      <div className="quiz-result">
        <div className={`result-header ${result.passed ? 'passed' : 'failed'}`}>
          <h2>{result.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}</h2>
          <div className="score-display">
            <span className="score">{result.score}%</span>
            <span className="score-label">Your Score</span>
          </div>
          <p>
            You got {result.correctCount} out of {result.totalQuestions} questions correct.
            {result.passed 
              ? ` You passed! (Required: ${result.passingScore}%)`
              : ` You need ${result.passingScore}% to pass.`
            }
          </p>
        </div>

        <div className="answers-review">
          <h3>Review Your Answers</h3>
          {result.questionsWithAnswers.map((q, index) => (
            <div key={index} className={`question-review ${q.userAnswer === q.correctAnswer ? 'correct' : 'incorrect'}`}>
              <p className="question-text">
                <strong>Q{index + 1}:</strong> {q.question}
              </p>
              <div className="options-review">
                {q.options.map((option, optIndex) => (
                  <div 
                    key={optIndex} 
                    className={`option-review ${
                      optIndex === q.correctAnswer ? 'correct-answer' : ''
                    } ${
                      optIndex === q.userAnswer && optIndex !== q.correctAnswer ? 'wrong-answer' : ''
                    }`}
                  >
                    {option}
                    {optIndex === q.correctAnswer && <span className="badge">✓ Correct</span>}
                    {optIndex === q.userAnswer && optIndex !== q.correctAnswer && <span className="badge">✗ Your Answer</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-taking">
      <div className="quiz-header">
        <h2>Quiz Time!</h2>
        <p>Answer all questions and submit to see your results. You can retry unlimited times.</p>
        <div className="quiz-info">
          <span>📝 {quiz.questions.length} Questions</span>
          <span>✅ Passing Score: {quiz.passingScore}%</span>
        </div>
      </div>

      <div className="quiz-questions">
        {quiz.questions.map((question, qIndex) => (
          <div key={qIndex} className="quiz-question">
            <p className="question-text">
              <strong>Question {qIndex + 1}:</strong> {question.question}
            </p>
            <div className="question-options">
              {question.options.map((option, oIndex) => (
                <label key={oIndex} className="option-label">
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    checked={answers[qIndex] === oIndex}
                    onChange={() => handleAnswerChange(qIndex, oIndex)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="quiz-actions">
        <button 
          onClick={handleSubmit} 
          disabled={loading || Object.keys(answers).length !== quiz.questions.length}
          className="submit-btn"
        >
          {loading ? 'Submitting...' : 'Submit Quiz'}
        </button>
        <p className="progress-text">
          Answered: {Object.keys(answers).length} / {quiz.questions.length}
        </p>
      </div>
    </div>
  );
};

export default QuizTaking;
