import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CSRManagement.css';

const CSRManagement = ({ user }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ expiresAt: '', maxUses: '' });
  const [codes, setCodes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.isSuperAdmin) {
      fetchCodes();
      fetchAnalytics();
    }
  }, [user]);

  const fetchCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/csr/codes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCodes(data);
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/csr/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/csr/generate', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ text: 'CSR code generated successfully!', type: 'success' });
      setFormData({ expiresAt: '', maxUses: '' });
      setShowForm(false);
      fetchCodes();
      fetchAnalytics();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to generate code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/csr/codes/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: 'Code status updated!', type: 'success' });
      fetchCodes();
      fetchAnalytics();
    } catch (error) {
      setMessage({ text: 'Failed to update code status', type: 'error' });
    }
  };

  const handleDeleteCode = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete code "${code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/csr/codes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: 'CSR code deleted successfully!', type: 'success' });
      fetchCodes();
      fetchAnalytics();
    } catch (error) {
      setMessage({ text: 'Failed to delete code', type: 'error' });
    }
  };

  if (!user?.isSuperAdmin) {
    return (
      <div className="csr-management">
        <div className="csr-message error">
          <h3>⚠️ Access Denied</h3>
          <p>Only super admin can manage CSR codes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="csr-management">
      <div className="csr-header">
        <h2>🎓 CSR Code Management</h2>
        <button 
          className="generate-code-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✖ Cancel' : '➕ Generate Code'}
        </button>
      </div>

      {message.text && (
        <div className={`csr-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {analytics && (
        <div className="csr-analytics">
          <div className="csr-stat-card">
            <div className="csr-stat-value">{analytics.totalCodes}</div>
            <div className="csr-stat-label">Total Codes</div>
          </div>
          <div className="csr-stat-card">
            <div className="csr-stat-value">{analytics.activeCodes}</div>
            <div className="csr-stat-label">Active Codes</div>
          </div>
          <div className="csr-stat-card">
            <div className="csr-stat-value">{analytics.totalCsrUsers}</div>
            <div className="csr-stat-label">CSR Users</div>
          </div>
          <div className="csr-stat-card">
            <div className="csr-stat-value">{analytics.totalUses}</div>
            <div className="csr-stat-label">Total Uses</div>
          </div>
          <div className="csr-stat-card">
            <div className="csr-stat-value">{analytics.availableSlots}</div>
            <div className="csr-stat-label">Available Slots</div>
          </div>
          <div className="csr-stat-card">
            <div className="csr-stat-value">{analytics.expiredCodes}</div>
            <div className="csr-stat-label">Expired Codes</div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleGenerateCode} className="csr-form">
          <h3>Generate New CSR Code</h3>
          <div className="csr-form-row">
            <div className="csr-form-group">
              <label>Expiration Date *</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                required
              />
            </div>
            <div className="csr-form-group">
              <label>Maximum Uses *</label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                placeholder="e.g., 50"
                required
              />
            </div>
          </div>
          <div className="csr-form-actions">
            <button type="submit" className="csr-submit-btn" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Code'}
            </button>
            <button type="button" className="csr-cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="csr-codes-list">
        <h3>All CSR Codes</h3>
        {codes.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>No codes generated yet</p>
        ) : (
          codes.map((code) => (
            <div key={code._id} className="csr-code-item">
              <div className="csr-code-header">
                <div className="csr-code-value">{code.code}</div>
                <div className="csr-code-actions">
                  <button
                    className={`csr-toggle-btn ${code.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(code._id)}
                  >
                    {code.isActive ? '✓ Active' : '✗ Inactive'}
                  </button>
                  <button
                    className="csr-delete-btn"
                    onClick={() => handleDeleteCode(code._id, code.code)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <div className="csr-code-details">
                <div className="csr-code-detail">
                  <strong>Created By</strong>
                  <span>{code.createdBy?.name}</span>
                </div>
                <div className="csr-code-detail">
                  <strong>Expires</strong>
                  <span>{new Date(code.expiresAt).toLocaleString()}</span>
                </div>
                <div className="csr-code-detail">
                  <strong>Usage</strong>
                  <span>{code.currentUses} / {code.maxUses}</span>
                </div>
                <div className="csr-code-detail">
                  <strong>Status</strong>
                  <span style={{ color: new Date() > new Date(code.expiresAt) ? '#ff4444' : '#4CAF50' }}>
                    {new Date() > new Date(code.expiresAt) ? 'Expired' : 'Valid'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {analytics && analytics.recentCsrUsers.length > 0 && (
        <div className="csr-recent-users">
          <h3>Recent CSR Registrations</h3>
          {analytics.recentCsrUsers.map((user) => (
            <div key={user._id} className="csr-user-item">
              <div className="csr-user-info">
                <strong>{user.name}</strong> - {user.email}
              </div>
              <div className="csr-user-date">
                {new Date(user.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CSRManagement;
