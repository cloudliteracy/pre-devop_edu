import React, { useState, useEffect } from 'react';
import './QuizAnalytics.css';

const QuizAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState(null);

  useEffect(() => {
    fetchModules();
    fetchAnalytics();
  }, [selectedModule, searchTerm]);

  const fetchModules = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/modules');
      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedModule) params.append('moduleId', selectedModule);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`http://localhost:5000/api/admin/quiz-analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedModule) params.append('moduleId', selectedModule);

      const response = await fetch(`http://localhost:5000/api/admin/quiz-analytics/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiz-analytics.csv';
      a.click();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="quiz-analytics">
      <div className="analytics-header">
        <h2>Quiz Analytics Dashboard</h2>
        <button onClick={handleExport} className="export-btn">
          📊 Export CSV
        </button>
      </div>

      <div className="analytics-filters">
        <select 
          value={selectedModule} 
          onChange={(e) => setSelectedModule(e.target.value)}
          className="filter-select"
        >
          <option value="">All Modules</option>
          {modules.map(m => (
            <option key={m._id} value={m._id}>{m.title}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by learner name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {analytics && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">📝</div>
              <div className="card-content">
                <h3>{analytics.summary.totalAttempts}</h3>
                <p>Total Attempts</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h3>{analytics.summary.passedAttempts}</h3>
                <p>Passed Attempts</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>{analytics.summary.passRate}%</h3>
                <p>Pass Rate</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">⭐</div>
              <div className="card-content">
                <h3>{analytics.summary.avgScore}%</h3>
                <p>Average Score</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>{analytics.summary.totalLearners}</h3>
                <p>Total Learners</p>
              </div>
            </div>
          </div>

          <div className="learners-table-container">
            <h3>Learner Performance</h3>
            <table className="learners-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Module</th>
                  <th>Attempts</th>
                  <th>Best Score</th>
                  <th>Latest Score</th>
                  <th>Status</th>
                  <th>Certificate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.learners.map((learner, index) => (
                  <tr key={index}>
                    <td>
                      <div className="learner-info">
                        <strong>{learner.userName}</strong>
                        <span className="learner-email">{learner.userEmail}</span>
                      </div>
                    </td>
                    <td>{learner.moduleName}</td>
                    <td>{learner.totalAttempts}</td>
                    <td className="score">{learner.bestScore}%</td>
                    <td className="score">{learner.latestScore}%</td>
                    <td>
                      <span className={`status-badge ${learner.passed ? 'passed' : 'failed'}`}>
                        {learner.passed ? '✓ Passed' : '✗ Not Passed'}
                      </span>
                    </td>
                    <td>
                      {learner.certificateId ? (
                        <span className="cert-id">{learner.certificateId.slice(0, 15)}...</span>
                      ) : (
                        <span className="no-cert">N/A</span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => setSelectedLearner(learner)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedLearner && (
        <div className="learner-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Detailed Performance: {selectedLearner.userName}</h2>
              <button onClick={() => setSelectedLearner(null)} className="close-modal">×</button>
            </div>

            <div className="modal-body">
              <div className="learner-summary">
                <p><strong>Email:</strong> {selectedLearner.userEmail}</p>
                <p><strong>Module:</strong> {selectedLearner.moduleName}</p>
                <p><strong>Total Attempts:</strong> {selectedLearner.totalAttempts}</p>
                <p><strong>Best Score:</strong> {selectedLearner.bestScore}%</p>
              </div>

              <h3>Attempt History</h3>
              <div className="attempts-list">
                {selectedLearner.attempts.map((attempt, index) => (
                  <div key={index} className={`attempt-card ${attempt.passed ? 'passed' : 'failed'}`}>
                    <div className="attempt-header">
                      <span className="attempt-number">Attempt #{selectedLearner.attempts.length - index}</span>
                      <span className="attempt-score">{attempt.score}%</span>
                      <span className={`attempt-status ${attempt.passed ? 'passed' : 'failed'}`}>
                        {attempt.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                    <p className="attempt-date">
                      {new Date(attempt.attemptedAt).toLocaleString()}
                    </p>
                    {attempt.certificateId && (
                      <p className="attempt-cert">Certificate: {attempt.certificateId}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAnalytics;
