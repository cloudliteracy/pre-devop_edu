import React, { useState } from 'react';
import FileUploadQuestion from './FileUploadQuestion';
import axios from 'axios';

const SurveyResponseForm = ({ poll, onSuccess }) => {
  const [responses, setResponses] = useState({});
  const [fileResponses, setFileResponses] = useState({});
  const [linkResponses, setLinkResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleAnswerChange = (questionIndex, answer) => {
    setResponses(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleFilesChange = (questionIndex, files) => {
    setFileResponses(prev => ({
      ...prev,
      [questionIndex]: files
    }));
  };

  const handleLinksChange = (questionIndex, links) => {
    setLinkResponses(prev => ({
      ...prev,
      [questionIndex]: links
    }));
  };

  const checkVisibility = (question, qIndex) => {
    if (!question.logic || !question.logic.showIf) return true;

    const { questionIndex, operator, value } = question.logic.showIf;
    const dependentAnswer = responses[questionIndex];

    if (dependentAnswer === undefined) return false;

    // Handle single/multiple choice (index based) vs string based
    const answerToCompare = typeof dependentAnswer === 'number' 
      ? dependentAnswer.toString() 
      : Array.isArray(dependentAnswer) 
        ? dependentAnswer.map(v => v.toString())
        : dependentAnswer;

    switch (operator) {
      case 'equals':
        return Array.isArray(answerToCompare) 
          ? answerToCompare.includes(value.toString()) 
          : answerToCompare === value.toString();
      case 'not_equals':
        return Array.isArray(answerToCompare) 
          ? !answerToCompare.includes(value.toString()) 
          : answerToCompare !== value.toString();
      case 'contains':
        return answerToCompare.toString().toLowerCase().includes(value.toString().toLowerCase());
      default:
        return true;
    }
  };

  const getPipedText = (question) => {
    let text = question.questionText;
    if (question.piping?.enabled && question.piping.sourceQuestionIndex !== undefined) {
      const sourceAnswer = responses[question.piping.sourceQuestionIndex];
      let displayAnswer = '___';
      
      if (sourceAnswer !== undefined) {
        if (typeof sourceAnswer === 'number') {
          displayAnswer = poll.questions[question.piping.sourceQuestionIndex].options[sourceAnswer]?.text || sourceAnswer;
        } else if (Array.isArray(sourceAnswer)) {
          displayAnswer = sourceAnswer.map(idx => poll.questions[question.piping.sourceQuestionIndex].options[idx]?.text || idx).join(', ');
        } else {
          displayAnswer = sourceAnswer;
        }
      }
      
      text = text.replace(/\[ANSWER\]/g, displayAnswer);
    }
    return text;
  };

  const handleSubmit = async () => {
    // Validate required questions
    const unansweredRequired = poll.questions.filter((q, index) => {
      if (!q.isRequired) return false;
      
      if (q.questionType === 'open') {
        return !responses[index] || !responses[index].trim();
      }
      if (q.questionType === 'multiple') {
        return !responses[index] || responses[index].length === 0;
      }
      if (q.questionType === 'file_upload') {
        const hasFiles = fileResponses[index] && fileResponses[index].length > 0;
        const hasLinks = linkResponses[index] && linkResponses[index].length > 0;
        return !hasFiles && !hasLinks;
      }
      return responses[index] === undefined;
    });

    if (unansweredRequired.length > 0) {
      alert(`Please answer all required questions (${unansweredRequired.length} remaining)`);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      
      // Build responses array
      const responseArray = poll.questions.map((q, index) => ({
        questionIndex: index,
        answer: responses[index],
        links: linkResponses[index] || []
      }));

      formData.append('responses', JSON.stringify(responseArray));

      // Append files with question index
      poll.questions.forEach((q, index) => {
        if (q.questionType === 'file_upload' && fileResponses[index]) {
          fileResponses[index].forEach(file => {
            formData.append(`files_${index}`, file);
          });
        }
      });

      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/polls/${poll._id}/vote`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-response-form">
      {poll.questions.map((question, qIndex) => {
        const isVisible = checkVisibility(question, qIndex);
        if (!isVisible) return null;

        return (
          <div key={qIndex} className="survey-question">
            <h4 className="question-text">
              Q{qIndex + 1}: {getPipedText(question)}
              {question.isRequired && <span className="required-asterisk"> *</span>}
            </h4>
          <div className="question-badges">
            <span className="question-type-badge">
              {question.questionType === 'single' ? 'Single Choice' : 
               question.questionType === 'multiple' ? 'Multiple Choice' : 
               question.questionType === 'file_upload' ? 'File Upload' : 'Open-Ended'}
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

          {question.questionType === 'file_upload' && (
            <FileUploadQuestion
              questionIndex={qIndex}
              allowedFileTypes={question.allowedFileTypes || ['pdf', 'video', 'link']}
              onFilesChange={handleFilesChange}
              onLinksChange={handleLinksChange}
            />
          )}
        </div>
        );
      })}

      <button 
        onClick={handleSubmit} 
        className="submit-response-btn"
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Response'}
      </button>
    </div>
  );
};

export default SurveyResponseForm;
