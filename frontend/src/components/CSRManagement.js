import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CSRManagement.css';

const CSRManagement = ({ user }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ codeName: '', expiresAt: '', maxUses: '', accessDurationMonths: '12' });
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
      setFormData({ codeName: '', expiresAt: '', maxUses: '', accessDurationMonths: '12' });
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

  const handleRenewAccess = async (userId, userName, months) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/csr/users/${userId}/renew`, 
        { months },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: `Access renewed for ${userName} (${months} month(s))`, type: 'success' });
      fetchAnalytics();
    } catch (error) {
      setMessage({ text: 'Failed to renew access', type: 'error' });
    }
  };

  const handleExpelUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ EXPEL USER: ${userName}\n\nThis will PERMANENTLY DELETE this user from the platform.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/csr/users/${userId}/expel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: `User ${userName} has been expelled from the platform`, type: 'success' });
      fetchAnalytics();
    } catch (error) {
      setMessage({ text: 'Failed to expel user', type: 'error' });
    }
  };

  const handleSuspendCsrUser = async (userId, userName, isSuspended) => {
    const action = isSuspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} CSR user "${userName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/suspend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: `CSR user ${action}ed successfully`, type: 'success' });
      fetchAnalytics();
    } catch (error) {
      setMessage({ text: `Failed to ${action} CSR user`, type: 'error' });
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
            <div className="csr-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Code Name / Purpose *</label>
              <input
                type="text"
                value={formData.codeName}
                onChange={(e) => setFormData({ ...formData, codeName: e.target.value })}
                placeholder="e.g., Partner Program 2024, Student Trial, NGO Collaboration"
                required
              />
              <small style={{ color: '#999', marginTop: '5px' }}>Describe the purpose of this CSR code</small>
            </div>
          </div>
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
          <div className="csr-form-row">
            <div className="csr-form-group">
              <label>Access Duration (Months) *</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.accessDurationMonths}
                onChange={(e) => setFormData({ ...formData, accessDurationMonths: e.target.value })}
                placeholder="e.g., 12"
                required
              />
              <small style={{ color: '#999', marginTop: '5px' }}>How long users get free access (1-60 months)</small>
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
                <div>
                  <div className="csr-code-value">{code.code}</div>
                  <div className="csr-code-name">{code.codeName}</div>
                </div>
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
                  <strong>Access Duration</strong>
                  <span style={{ color: '#FFD700' }}>{code.accessDurationMonths || 12} months</span>
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
          <table className="csr-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Access Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentCsrUsers.map((csrUser) => {
                const expiresAt = new Date(csrUser.csrAccessExpiresAt);
                const now = new Date();
                const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
                let expiryColor = '#4CAF50';
                if (daysUntilExpiry < 30) expiryColor = '#ff4444';
                else if (daysUntilExpiry < 90) expiryColor = '#FFA500';

                return (
                  <tr key={csrUser._id}>
                    <td><strong>{csrUser.name}</strong></td>
                    <td>{csrUser.email}</td>
                    <td>{new Date(csrUser.createdAt).toLocaleDateString()}</td>
                    <td style={{ color: expiryColor, fontWeight: 'bold' }}>
                      {expiresAt.toLocaleDateString()}
                      {daysUntilExpiry > 0 && ` (${daysUntilExpiry}d)`}
                      {daysUntilExpiry <= 0 && ' (EXPIRED)'}
                    </td>
                    <td>
                      {csrUser.isSuspended ? (
                        <span style={{ color: '#ff4444', fontWeight: 'bold' }}>SUSPENDED</span>
                      ) : (
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Active</span>
                      )}
                    </td>
                    <td>
                      <div className="csr-user-actions">
                        <select 
                          className="renew-select"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleRenewAccess(csrUser._id, csrUser.name, parseInt(e.target.value));
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Renew Access</option>
                          <option value="-2" style={{ color: '#ff4444' }}>-2 Months</option>
                          <option value="-1" style={{ color: '#ff4444' }}>-1 Month</option>
                          <option value="3" style={{ color: '#4CAF50' }}>+3 Months</option>
                          <option value="6" style={{ color: '#4CAF50' }}>+6 Months</option>
                          <option value="12" style={{ color: '#4CAF50' }}>+12 Months</option>
                        </select>
                        <button 
                          className="suspend-csr-btn"
                          onClick={() => handleSuspendCsrUser(csrUser._id, csrUser.name, csrUser.isSuspended)}
                        >
                          {csrUser.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button 
                          className="expel-btn"
                          onClick={() => handleExpelUser(csrUser._id, csrUser.name)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CSRManagement;
