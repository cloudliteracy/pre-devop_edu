import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnnouncementManagement.css';

const AnnouncementManagement = ({ user, isPrimarySuperAdmin }) => {
  const [myAnnouncements, setMyAnnouncements] = useState([]);
  const [pendingAnnouncements, setPendingAnnouncements] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiresAt: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('AnnouncementManagement - isPrimarySuperAdmin:', isPrimarySuperAdmin);
    console.log('AnnouncementManagement - user:', user);
    fetchMyAnnouncements();
    if (isPrimarySuperAdmin) {
      fetchPendingAnnouncements();
    }
  }, [isPrimarySuperAdmin]);

  const fetchMyAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/announcements/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch my announcements:', error);
    }
  };

  const fetchPendingAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/announcements/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Pending announcements fetched:', data);
      setPendingAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch pending announcements:', error);
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
      fetchMyAnnouncements();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to create announcement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/announcements/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: 'Announcement approved!', type: 'success' });
      fetchMyAnnouncements();
      fetchPendingAnnouncements();
    } catch (error) {
      setMessage({ text: 'Failed to approve announcement', type: 'error' });
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/announcements/${id}/reject`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: 'Announcement rejected!', type: 'success' });
      fetchMyAnnouncements();
      fetchPendingAnnouncements();
    } catch (error) {
      setMessage({ text: 'Failed to reject announcement', type: 'error' });
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
      fetchMyAnnouncements();
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
      fetchMyAnnouncements();
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

      <div className="announcement-tabs">
        <button 
          className={activeTab === 'my' ? 'active' : ''}
          onClick={() => setActiveTab('my')}
        >
          My Announcements
        </button>
        {isPrimarySuperAdmin && (
          <button 
            className={activeTab === 'pending' ? 'active' : ''}
            onClick={() => {
              console.log('Switching to pending tab, isPrimarySuperAdmin:', isPrimarySuperAdmin);
              setActiveTab('pending');
            }}
          >
            Pending Approval ({pendingAnnouncements.length})
          </button>
        )}
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
        {activeTab === 'my' ? (
          <>
            <h3>My Announcements</h3>
            {myAnnouncements.length === 0 ? (
              <p className="no-announcements">You haven't created any announcements yet</p>
            ) : (
              myAnnouncements.map((announcement) => (
                <div key={announcement._id} className="announcement-item">
                  <div className="announcement-item-header">
                    <div className="title-with-status">
                      <h4>{announcement.title}</h4>
                      <span className={`status-badge ${announcement.status}`}>
                        {announcement.status === 'approved' && '✓ Approved'}
                        {announcement.status === 'pending' && '⏳ Pending'}
                        {announcement.status === 'rejected' && '✗ Rejected'}
                      </span>
                    </div>
                    <div className="announcement-actions">
                      {announcement.status === 'pending' && isPrimarySuperAdmin && (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() => handleApprove(announcement._id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleReject(announcement._id)}
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {announcement.status === 'approved' && (
                        <button
                          className={`toggle-btn ${announcement.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(announcement._id, announcement.isActive)}
                        >
                          {announcement.isActive ? '✓ Active' : '✗ Inactive'}
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(announcement._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="announcement-content">{announcement.content}</p>
                  {announcement.status === 'rejected' && announcement.rejectionReason && (
                    <div className="rejection-reason">
                      <strong>Rejection Reason:</strong> {announcement.rejectionReason}
                    </div>
                  )}
                  <div className="announcement-meta">
                    <span>Created: {new Date(announcement.createdAt).toLocaleString()}</span>
                    {announcement.expiresAt && (
                      <span>Expires: {new Date(announcement.expiresAt).toLocaleString()}</span>
                    )}
                    {announcement.approvedBy && (
                      <span>Approved by: {announcement.approvedBy.name}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <h3>Pending Approval</h3>
            {pendingAnnouncements.length === 0 ? (
              <p className="no-announcements">No pending announcements</p>
            ) : (
              pendingAnnouncements.map((announcement) => (
                <div key={announcement._id} className="announcement-item pending">
                  <div className="announcement-item-header">
                    <h4>{announcement.title}</h4>
                    <div className="announcement-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(announcement._id)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleReject(announcement._id)}
                      >
                        ✗ Reject
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
          </>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagement;
