import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnnouncementManagement.css';

const AnnouncementManagement = ({ user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiresAt: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:5000/api/announcements', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage({ text: 'Announcement created successfully!', type: 'success' });
      setFormData({ title: '', content: '', expiresAt: '' });
      setShowCreateForm(false);
      fetchAnnouncements();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to create announcement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/announcements/${id}`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: 'Announcement status updated!', type: 'success' });
      fetchAnnouncements();
    } catch (error) {
      setMessage({ text: 'Failed to update announcement', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: 'Announcement deleted successfully!', type: 'success' });
      fetchAnnouncements();
    } catch (error) {
      setMessage({ text: 'Failed to delete announcement', type: 'error' });
    }
  };

  const canManage = user?.isSuperAdmin || user?.canManageAnnouncements;

  if (!canManage) {
    return (
      <div className="announcement-management">
        <div className="no-permission">
          <h3>⚠️ Access Denied</h3>
          <p>You don't have permission to manage announcements.</p>
          <p>Contact the super admin to request access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="announcement-management">
      <div className="announcement-header">
        <h2>Announcement Management</h2>
        <button 
          className="create-announcement-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✖ Cancel' : '➕ Create Announcement'}
        </button>
      </div>

      {message.text && (
        <div className={`announcement-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="announcement-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
              required
              placeholder="Enter announcement title"
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              maxLength={1000}
              rows={5}
              required
              placeholder="Enter announcement content"
            />
          </div>

          <div className="form-group">
            <label>Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Announcement'}
          </button>
        </form>
      )}

      <div className="announcements-list">
        <h3>All Announcements</h3>
        {announcements.length === 0 ? (
          <p className="no-announcements">No announcements yet</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement._id} className="announcement-item">
              <div className="announcement-item-header">
                <h4>{announcement.title}</h4>
                <div className="announcement-actions">
                  <button
                    className={`toggle-btn ${announcement.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleActive(announcement._id, announcement.isActive)}
                  >
                    {announcement.isActive ? '✓ Active' : '✗ Inactive'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(announcement._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="announcement-content">{announcement.content}</p>
              <div className="announcement-meta">
                <span>By: {announcement.createdBy?.name}</span>
                <span>Created: {new Date(announcement.createdAt).toLocaleString()}</span>
                {announcement.expiresAt && (
                  <span>Expires: {new Date(announcement.expiresAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagement;
