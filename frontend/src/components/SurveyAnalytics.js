import React, { useState } from 'react';
import QuestionAnalytics from './QuestionAnalytics';
import './SurveyAnalytics.css';

const SurveyAnalytics = ({ surveys }) => {
  const [expandedSurveys, setExpandedSurveys] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');

  const toggleSurveyExpansion = (surveyId) => {
    setExpandedSurveys(prev => ({
      ...prev,
      [surveyId]: !prev[surveyId]
    }));
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

  const getTotalResponses = (survey) => {
    if (!survey.questions || survey.questions.length === 0) return 0;
    return survey.questions[0].responses.length;
  };

  const filteredSurveys = surveys.filter(survey => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return survey.isActive;
    if (filterStatus === 'expired') return !survey.isActive;
    return true;
  });

  return (
    <div className="survey-analytics-container">
      <div className="survey-analytics-header">
        <h2>Survey Analytics</h2>
        <div className="survey-filter-tabs">
          <button
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            All Surveys ({surveys.length})
          </button>
          <button
            className={filterStatus === 'active' ? 'active' : ''}
            onClick={() => setFilterStatus('active')}
          >
            Active ({surveys.filter(s => s.isActive).length})
          </button>
          <button
            className={filterStatus === 'expired' ? 'active' : ''}
            onClick={() => setFilterStatus('expired')}
          >
            Expired ({surveys.filter(s => !s.isActive).length})
          </button>
        </div>
      </div>

      {filteredSurveys.length === 0 ? (
        <div className="no-surveys">No surveys found</div>
      ) : (
        <div className="surveys-list">
          {filteredSurveys.map(survey => {
            const isExpanded = expandedSurveys[survey._id];
            const totalResponses = getTotalResponses(survey);

            return (
              <div key={survey._id} className="survey-analytics-card">
                <div className="survey-card-header">
                  <div className="survey-info">
                    <h3>{survey.title}</h3>
                    <div className="survey-meta-info">
                      <span className="survey-creator">By: {survey.user?.name || 'Unknown'}</span>
                      <span className="survey-questions-count">{survey.questions?.length || 0} Questions</span>
                      <span className="survey-responses-count">{totalResponses} Responses</span>
                      <span className={`survey-status ${survey.isActive ? 'active' : 'expired'}`}>
                        {survey.isActive ? formatTimeRemaining(survey.expiresAt) : 'Expired'}
                      </span>
                    </div>
                  </div>
                  <button
                    className="expand-survey-btn"
                    onClick={() => toggleSurveyExpansion(survey._id)}
                  >
                    {isExpanded ? '▼ Hide Details' : '▶ View Details'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="survey-details">
                    {survey.questions.map((question, qIndex) => (
                      <div key={qIndex} className="question-analytics-wrapper">
                        <QuestionAnalytics
                          question={question}
                          questionIndex={qIndex}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SurveyAnalytics;
