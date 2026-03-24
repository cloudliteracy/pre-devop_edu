import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socketService from '../services/socket';
import ContentManagement from '../components/ContentManagement';
import QuizAnalytics from '../components/QuizAnalytics';
import SurveyAnalytics from '../components/SurveyAnalytics';
import AnnouncementBar from '../components/AnnouncementBar';
import CSRManagement from '../components/CSRManagement';
import * as contentService from '../services/content';
import * as adminService from '../services/admin';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedUser, setExpandedUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '' });
  const [tempPassword, setTempPassword] = useState('');
  const [adminMessage, setAdminMessage] = useState({ text: '', type: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchDashboardData();

    socketService.connect();
    socketService.onOnlineUsersUpdate((users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketService.offOnlineUsersUpdate();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'surveyAnalytics' && (currentUser?.isSuperAdmin || currentUser?.canViewSurveyAnalytics)) {
      fetchSurveyAnalytics();
    }
  }, [activeTab, currentUser]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, analyticsRes, activityRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', { headers }),
        axios.get('http://localhost:5000/api/admin/users?limit=10', { headers }),
        axios.get('http://localhost:5000/api/admin/modules/analytics', { headers }),
        axios.get('http://localhost:5000/api/admin/activity', { headers })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setAnalytics(analyticsRes.data);
      setActivity(activityRes.data);
      
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.isSuperAdmin) {
        const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { headers });
        setAdmins(adminsRes.data);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Admin access required');
        navigate('/');
      }
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage < 30) return '#ff4444';
    if (percentage < 70) return '#FFD700';
    return '#4CAF50';
  };

  const toggleUserDetails = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/change-password', 
        { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ 
        text: error.response?.data?.message || 'Failed to change password', 
        type: 'error' 
      });
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminMessage({ text: '', type: '' });

    if (!newAdminForm.name || !newAdminForm.email) {
      setAdminMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log('Current user:', user);
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('Sending request:', newAdminForm);
      
      const { data } = await axios.post('http://localhost:5000/api/admin/create-admin',
        newAdminForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Success response:', data);
      
      setTempPassword(data.temporaryPassword);
      setAdminMessage({ text: 'Admin created successfully! Save the temporary password.', type: 'success' });
      setNewAdminForm({ name: '', email: '' });
      
      const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAdmins(adminsRes.data);
    } catch (error) {
      console.error('Create admin error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setAdminMessage({ 
        text: error.response?.data?.message || 'Failed to create admin', 
        type: 'error' 
      });
    }
  };

  const handleToggleSuspension = async (adminId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(`http://localhost:5000/api/admin/admins/${adminId}/toggle-suspension`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAdminMessage({ text: data.message, type: 'success' });
      
      const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAdmins(adminsRes.data);
    } catch (error) {
      setAdminMessage({ 
        text: error.response?.data?.message || 'Failed to update admin status', 
        type: 'error' 
      });
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to permanently delete admin "${adminName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.delete(`http://localhost:5000/api/admin/admins/${adminId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAdminMessage({ text: data.message, type: 'success' });
      
      const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAdmins(adminsRes.data);
    } catch (error) {
      setAdminMessage({ 
        text: error.response?.data?.message || 'Failed to delete admin', 
        type: 'error' 
      });
    }
  };

  const handleToggleUploadAccess = async (adminId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await contentService.toggleUploadAccess(adminId);
      
      setAdminMessage({ text: data.message, type: 'success' });
      
      const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAdmins(adminsRes.data);
    } catch (error) {
      setAdminMessage({ 
        text: error.response?.data?.message || 'Failed to update upload access', 
        type: 'error' 
      });
    }
  };

  const closeCreateAdminModal = () => {
    setShowCreateAdminModal(false);
    setNewAdminForm({ name: '', email: '' });
    setTempPassword('');
    setAdminMessage({ text: '', type: '' });
  };

  const handleToggleAnalyticsAccess = async (adminId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(`http://localhost:5000/api/admin/admins/${adminId}/toggle-analytics-access`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAdminMessage({ text: data.message, type: 'success' });
      
      const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAdmins(adminsRes.data);
    } catch (error) {
      setAdminMessage({ 
        text: error.response?.data?.message || 'Failed to update analytics access', 
        type: 'error' 
      });
    }
  };

  const handleToggleSurveyAnalyticsAccess = async (adminId) => {
    try {
      const { data } = await adminService.toggleSurveyAnalyticsAccess(adminId);
      setAdminMessage({ text: data.message, type: 'success' });
      
      const token = localStorage.getItem('token');
      const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAdmins(adminsRes.data);
    } catch (error) {
      setAdminMessage({ 
        text: error.response?.data?.message || 'Failed to update survey analytics access', 
        type: 'error' 
      });
    }
  };

  const fetchSurveyAnalytics = async () => {
    try {
      const data = await adminService.getSurveyAnalytics();
      setSurveys(data);
    } catch (error) {
      console.error('Failed to fetch survey analytics:', error);
    }
  };

  const handleToggleAnnouncementAccess = async (adminId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(`http://localhost:5000/api/announcements/admin/${adminId}/toggle-access`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdminMessage({ text: data.message, type: 'success' });
      
      const adminsRes = await axios.get('http://localhost:5000/api/admin/admins', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAdmins(adminsRes.data);
    } catch (error) {
      setAdminMessage({ 
        text: error.response?.data?.message || 'Failed to update announcement access', 
        type: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <AnnouncementBar />
      <div style={styles.content}>
        <h1 style={styles.title}>Admin Dashboard</h1>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'overview' ? '#FFD700' : '#1a1a1a',
              color: activeTab === 'overview' ? '#000' : '#FFD700'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'users' ? '#FFD700' : '#1a1a1a',
              color: activeTab === 'users' ? '#000' : '#FFD700'
            }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'analytics' ? '#FFD700' : '#1a1a1a',
              color: activeTab === 'analytics' ? '#000' : '#FFD700'
            }}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'settings' ? '#FFD700' : '#1a1a1a',
              color: activeTab === 'settings' ? '#000' : '#FFD700'
            }}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('online')}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === 'online' ? '#FFD700' : '#1a1a1a',
              color: activeTab === 'online' ? '#000' : '#FFD700'
            }}
          >
            Online Users ({onlineUsers.length})
          </button>
          {JSON.parse(localStorage.getItem('user'))?.isSuperAdmin && (
            <button
              onClick={() => setActiveTab('adminManagement')}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === 'adminManagement' ? '#FFD700' : '#1a1a1a',
                color: activeTab === 'adminManagement' ? '#000' : '#FFD700'
              }}
            >
              Admin Management
            </button>
          )}
          {(currentUser?.isSuperAdmin || currentUser?.canUploadContent) && (
            <button
              onClick={() => setActiveTab('contentManagement')}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === 'contentManagement' ? '#FFD700' : '#1a1a1a',
                color: activeTab === 'contentManagement' ? '#000' : '#FFD700'
              }}
            >
              Content Management
            </button>
          )}
          {(currentUser?.isSuperAdmin || currentUser?.canViewQuizAnalytics) && (
            <button
              onClick={() => setActiveTab('quizAnalytics')}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === 'quizAnalytics' ? '#FFD700' : '#1a1a1a',
                color: activeTab === 'quizAnalytics' ? '#000' : '#FFD700'
              }}
            >
              Quiz Analytics
            </button>
          )}
          {(currentUser?.isSuperAdmin || currentUser?.canViewSurveyAnalytics) && (
            <button
              onClick={() => setActiveTab('surveyAnalytics')}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === 'surveyAnalytics' ? '#FFD700' : '#1a1a1a',
                color: activeTab === 'surveyAnalytics' ? '#000' : '#FFD700'
              }}
            >
              Survey Analytics
            </button>
          )}
          {currentUser?.isSuperAdmin && (
            <button
              onClick={() => setActiveTab('csrManagement')}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === 'csrManagement' ? '#FFD700' : '#1a1a1a',
                color: activeTab === 'csrManagement' ? '#000' : '#FFD700'
              }}
            >
              🎓 CSR Management
            </button>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>👥</div>
                <div style={styles.statValue}>{stats.totalUsers}</div>
                <div style={styles.statLabel}>Total Users</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📚</div>
                <div style={styles.statValue}>{stats.totalEnrollments}</div>
                <div style={styles.statLabel}>Enrollments</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>💰</div>
                <div style={styles.statValue}>${stats.totalRevenue}</div>
                <div style={styles.statLabel}>Total Revenue</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📊</div>
                <div style={styles.statValue}>{stats.avgCompletion}%</div>
                <div style={styles.statLabel}>Avg Completion</div>
              </div>
              <div style={{...styles.statCard, gridColumn: 'span 2'}}>
                <div style={styles.statIcon}>🌐</div>
                <div style={styles.statValue}>{stats.visitors?.total || 0}</div>
                <div style={styles.statLabel}>Total Visitors</div>
                <div style={styles.visitorBreakdown}>
                  <div style={styles.visitorStat}>
                    <span style={styles.visitorLabel}>Today:</span>
                    <span style={styles.visitorValue}>{stats.visitors?.today || 0}</span>
                  </div>
                  <div style={styles.visitorStat}>
                    <span style={styles.visitorLabel}>Super Admins:</span>
                    <span style={styles.visitorValue}>{stats.visitors?.breakdown?.super_admin || 0}</span>
                  </div>
                  <div style={styles.visitorStat}>
                    <span style={styles.visitorLabel}>Admins:</span>
                    <span style={styles.visitorValue}>{stats.visitors?.breakdown?.admin || 0}</span>
                  </div>
                  <div style={styles.visitorStat}>
                    <span style={styles.visitorLabel}>Learners:</span>
                    <span style={styles.visitorValue}>{stats.visitors?.breakdown?.learner || 0}</span>
                  </div>
                  <div style={styles.visitorStat}>
                    <span style={styles.visitorLabel}>Guests:</span>
                    <span style={styles.visitorValue}>{stats.visitors?.breakdown?.guest || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Recent Activity</h2>
              
              <h3 style={styles.subsectionTitle}>Recent Registrations</h3>
              <div style={styles.activityList}>
                {activity?.recentUsers.map((user) => (
                  <div key={user._id} style={styles.activityItem}>
                    <span style={styles.activityIcon}>👤</span>
                    <div style={styles.activityContent}>
                      <span style={styles.activityName}>{user.name}</span>
                      <span style={styles.activityDetail}>{user.email}</span>
                    </div>
                    <span style={styles.activityDate}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>

              <h3 style={styles.subsectionTitle}>Recent Purchases</h3>
              <div style={styles.activityList}>
                {activity?.recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment._id} style={styles.activityItem}>
                    <span style={styles.activityIcon}>💳</span>
                    <div style={styles.activityContent}>
                      <span style={styles.activityName}>{payment.userId?.name}</span>
                      <span style={styles.activityDetail}>
                        {payment.moduleId ? payment.moduleId.title : 'Donation'} - ${payment.amount}
                      </span>
                    </div>
                    <span style={styles.activityDate}>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>User Management</h2>
            <div style={styles.table}>
              <div style={styles.tableHeader}>
                <div style={styles.tableCell}>Name</div>
                <div style={styles.tableCell}>Email</div>
                <div style={styles.tableCell}>Modules</div>
                <div style={styles.tableCell}>Progress</div>
                <div style={styles.tableCell}>Joined</div>
                <div style={styles.tableCell}>Actions</div>
              </div>
              {users.map((user) => (
                <React.Fragment key={user._id}>
                  <div style={styles.tableRow}>
                    <div style={styles.tableCell}>{user.name}</div>
                    <div style={styles.tableCell}>{user.email}</div>
                    <div style={styles.tableCell}>{user.purchasedModules.length}</div>
                    <div style={styles.tableCell}>
                      <div style={{
                        ...styles.progressBadge,
                        backgroundColor: getProgressColor(user.overallProgress)
                      }}>
                        {user.overallProgress}%
                      </div>
                    </div>
                    <div style={styles.tableCell}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div style={styles.tableCell}>
                      <button 
                        onClick={() => toggleUserDetails(user._id)}
                        style={styles.detailsButton}
                      >
                        {expandedUser === user._id ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedUser === user._id && (
                    <div style={styles.expandedRow}>
                      <h3 style={styles.expandedTitle}>Module Progress Details</h3>
                      {user.moduleProgress && user.moduleProgress.length > 0 ? (
                        <div style={styles.progressGrid}>
                          {user.moduleProgress.map((progress, index) => (
                            <div key={index} style={styles.progressCard}>
                              <div style={styles.progressCardHeader}>
                                <span style={styles.progressModuleTitle}>{progress.moduleTitle}</span>
                                <span style={{
                                  ...styles.progressPercentage,
                                  color: getProgressColor(progress.completionPercentage)
                                }}>
                                  {progress.completionPercentage}%
                                </span>
                              </div>
                              <div style={styles.progressDetails}>
                                <div style={styles.progressDetailItem}>
                                  <span style={styles.progressIcon}>🎥</span>
                                  <span style={styles.progressDetailText}>Videos: {progress.videosWatched}</span>
                                </div>
                                <div style={styles.progressDetailItem}>
                                  <span style={styles.progressIcon}>📄</span>
                                  <span style={styles.progressDetailText}>PDFs: {progress.pdfsDownloaded}</span>
                                </div>
                                <div style={styles.progressDetailItem}>
                                  <span style={styles.progressIcon}>✅</span>
                                  <span style={styles.progressDetailText}>
                                    Quiz: {progress.quizCompleted ? `${progress.quizScore}%` : 'Not Completed'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={styles.noProgress}>No progress data available</p>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Module Analytics</h2>
            <div style={styles.analyticsGrid}>
              {analytics.map((module) => (
                <div key={module.moduleId} style={styles.analyticsCard}>
                  <h3 style={styles.analyticsTitle}>{module.title}</h3>
                  <div style={styles.analyticsStats}>
                    <div style={styles.analyticsStat}>
                      <span style={styles.analyticsLabel}>Enrollments</span>
                      <span style={styles.analyticsValue}>{module.enrollments}</span>
                    </div>
                    <div style={styles.analyticsStat}>
                      <span style={styles.analyticsLabel}>Revenue</span>
                      <span style={styles.analyticsValue}>${module.revenue}</span>
                    </div>
                    <div style={styles.analyticsStat}>
                      <span style={styles.analyticsLabel}>Avg Completion</span>
                      <span style={styles.analyticsValue}>{module.avgCompletion}%</span>
                    </div>
                    <div style={styles.analyticsStat}>
                      <span style={styles.analyticsLabel}>Avg Quiz Score</span>
                      <span style={styles.analyticsValue}>{module.avgQuizScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Account Settings</h2>
            
            <div style={styles.settingsCard}>
              <h3 style={styles.settingsSubtitle}>Change Password</h3>
              <form onSubmit={handlePasswordChange} style={styles.passwordForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Current Password</label>
                  <div style={styles.passwordInputWrapper}>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      style={styles.input}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      style={styles.eyeButton}
                    >
                      {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>New Password</label>
                  <div style={styles.passwordInputWrapper}>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      style={styles.input}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      style={styles.eyeButton}
                    >
                      {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <div style={styles.passwordInputWrapper}>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      style={styles.input}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      style={styles.eyeButton}
                    >
                      {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {passwordMessage.text && (
                  <div style={{
                    ...styles.message,
                    backgroundColor: passwordMessage.type === 'success' ? '#4CAF50' : '#ff4444'
                  }}>
                    {passwordMessage.text}
                  </div>
                )}

                <button type="submit" style={styles.submitButton}>
                  Change Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Online Users Tab */}
        {activeTab === 'online' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Online Users - Real-time</h2>
            <p style={styles.onlineSubtitle}>
              {onlineUsers.length} {onlineUsers.length === 1 ? 'learner is' : 'learners are'} currently active on the platform
            </p>
            
            {onlineUsers.length > 0 ? (
              <div style={styles.onlineUsersGrid}>
                {onlineUsers.map((user, index) => (
                  <div key={index} style={styles.onlineUserCard}>
                    <div style={styles.onlineUserHeader}>
                      <div style={styles.onlineUserInfo}>
                        <div style={styles.onlineUserName}>
                          {user.userName}
                          <span style={styles.onlineStatus}>● Online</span>
                        </div>
                        <div style={styles.onlineUserEmail}>{user.userEmail}</div>
                        {user.location && (
                          <div style={styles.locationInfo}>
                            <span style={styles.locationIcon}>🌍</span>
                            <span style={styles.locationText}>
                              {user.location.country} {user.location.city !== 'Unknown' && `• ${user.location.city}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={styles.onlineUserActivity}>
                      <div style={styles.activityLabel}>Current Activity:</div>
                      <div style={styles.activityValue}>
                        {user.currentModule ? (
                          <>
                            <span style={styles.activityIcon}>📚</span>
                            <div style={styles.moduleActivityInfo}>
                              <span>{user.currentModule.moduleTitle}</span>
                              {user.currentModule.progress !== undefined && (
                                <div style={styles.progressBarContainer}>
                                  <div style={styles.progressBarBg}>
                                    <div style={{
                                      ...styles.progressBarFill,
                                      width: `${user.currentModule.progress}%`,
                                      backgroundColor: user.currentModule.progress < 30 ? '#ff4444' : 
                                                      user.currentModule.progress < 70 ? '#FFD700' : '#4CAF50'
                                    }}></div>
                                  </div>
                                  <span style={styles.progressText}>{user.currentModule.progress}%</span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={styles.activityIcon}>🏠</span>
                            <span>Browsing platform</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div style={styles.onlineUserTime}>
                      Connected: {new Date(user.connectedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noOnlineUsers}>
                <div style={styles.noOnlineIcon}>😴</div>
                <div style={styles.noOnlineText}>No users currently online</div>
                <div style={styles.noOnlineSubtext}>Users will appear here when they log in and browse the platform</div>
              </div>
            )}
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === 'adminManagement' && JSON.parse(localStorage.getItem('user'))?.isSuperAdmin && (
          <div style={styles.section}>
            <div style={styles.adminManagementHeader}>
              <h2 style={styles.sectionTitle}>Admin Management</h2>
              <button onClick={() => setShowCreateAdminModal(true)} style={styles.createAdminButton}>
                + Create New Admin
              </button>
            </div>

            {adminMessage.text && (
              <div style={{
                ...styles.message,
                backgroundColor: adminMessage.type === 'success' ? '#4CAF50' : '#ff4444',
                marginBottom: '20px'
              }}>
                {adminMessage.text}
              </div>
            )}

            <div style={styles.adminsGrid}>
              {admins.map((admin) => (
                <div key={admin._id} style={styles.adminCard}>
                  <div style={styles.adminCardHeader}>
                    <div>
                      <div style={styles.adminName}>
                        {admin.name}
                        {admin.isSuperAdmin && <span style={styles.superAdminBadge}>SUPER ADMIN</span>}
                        {admin.isSuspended && <span style={styles.suspendedBadge}>SUSPENDED</span>}
                      </div>
                      <div style={styles.adminEmail}>{admin.email}</div>
                    </div>
                  </div>
                  
                  <div style={styles.adminCardBody}>
                    <div style={styles.adminInfo}>
                      <span style={styles.adminInfoLabel}>Role:</span>
                      <span style={styles.adminInfoValue}>{admin.role}</span>
                    </div>
                    <div style={styles.adminInfo}>
                      <span style={styles.adminInfoLabel}>Created:</span>
                      <span style={styles.adminInfoValue}>{new Date(admin.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.adminInfo}>
                      <span style={styles.adminInfoLabel}>Status:</span>
                      <span style={{
                        ...styles.adminInfoValue,
                        color: admin.isSuspended ? '#ff4444' : '#4CAF50'
                      }}>
                        {admin.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {!admin.isSuperAdmin && (
                    <div style={styles.adminActions}>
                      <button
                        onClick={() => handleToggleSuspension(admin._id)}
                        style={{
                          ...styles.suspendButton,
                          backgroundColor: admin.isSuspended ? '#4CAF50' : '#ff4444',
                          marginBottom: '10px'
                        }}
                      >
                        {admin.isSuspended ? 'Reinstate' : 'Suspend'}
                      </button>
                      {currentUser?.isSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleToggleUploadAccess(admin._id)}
                            style={{
                              ...styles.suspendButton,
                              backgroundColor: admin.canUploadContent ? '#ff9800' : '#4CAF50',
                              marginBottom: '10px'
                            }}
                          >
                            {admin.canUploadContent ? '🚫 Revoke Upload Access' : '✅ Grant Upload Access'}
                          </button>
                          <button
                            onClick={() => handleToggleAnalyticsAccess(admin._id)}
                            style={{
                              ...styles.suspendButton,
                              backgroundColor: admin.canViewQuizAnalytics ? '#ff9800' : '#4CAF50',
                              marginBottom: '10px'
                            }}
                          >
                            {admin.canViewQuizAnalytics ? '🚫 Revoke Quiz Analytics' : '✅ Grant Quiz Analytics'}
                          </button>
                          <button
                            onClick={() => handleToggleSurveyAnalyticsAccess(admin._id)}
                            style={{
                              ...styles.suspendButton,
                              backgroundColor: admin.canViewSurveyAnalytics ? '#ff9800' : '#4CAF50',
                              marginBottom: '10px'
                            }}
                          >
                            {admin.canViewSurveyAnalytics ? '🚫 Revoke Survey Analytics' : '✅ Grant Survey Analytics'}
                          </button>
                          <button
                            onClick={() => handleToggleAnnouncementAccess(admin._id)}
                            style={{
                              ...styles.suspendButton,
                              backgroundColor: admin.canManageAnnouncements ? '#ff9800' : '#4CAF50',
                              marginBottom: '10px'
                            }}
                          >
                            {admin.canManageAnnouncements ? '🚫 Revoke Announcements' : '✅ Grant Announcements'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                        style={styles.deleteButton}
                      >
                        Delete Admin
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'contentManagement' && (
          <ContentManagement user={currentUser} />
        )}

        {/* Quiz Analytics Tab */}
        {activeTab === 'quizAnalytics' && (
          <QuizAnalytics />
        )}

        {/* Survey Analytics Tab */}
        {activeTab === 'surveyAnalytics' && (
          <SurveyAnalytics surveys={surveys} />
        )}

        {/* CSR Management Tab */}
        {activeTab === 'csrManagement' && currentUser?.isSuperAdmin && (
          <CSRManagement user={currentUser} />
        )}

        {/* Create Admin Modal */}
        {showCreateAdminModal && (
          <div style={styles.modalOverlay} onClick={closeCreateAdminModal}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Create New Admin</h2>
              
              {!tempPassword ? (
                <form onSubmit={handleCreateAdmin} style={styles.modalForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Name</label>
                    <input
                      type="text"
                      value={newAdminForm.name}
                      onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  {adminMessage.text && !tempPassword && (
                    <div style={{
                      ...styles.message,
                      backgroundColor: adminMessage.type === 'success' ? '#4CAF50' : '#ff4444'
                    }}>
                      {adminMessage.text}
                    </div>
                  )}

                  <div style={styles.modalButtons}>
                    <button type="button" onClick={closeCreateAdminModal} style={styles.cancelButton}>
                      Cancel
                    </button>
                    <button type="submit" style={styles.submitButton}>
                      Create Admin
                    </button>
                  </div>
                </form>
              ) : (
                <div style={styles.passwordDisplay}>
                  <p style={styles.passwordWarning}>
                    ⚠️ Save this temporary password! It will only be shown once.
                  </p>
                  <div style={styles.passwordBox}>
                    <span style={styles.passwordLabel}>Temporary Password:</span>
                    <span style={styles.passwordValue}>{tempPassword}</span>
                  </div>
                  <p style={styles.passwordNote}>
                    The new admin must change this password on first login.
                  </p>
                  <button onClick={closeCreateAdminModal} style={styles.submitButton}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    padding: '40px 20px'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  title: {
    color: '#FFD700',
    fontSize: '42px',
    marginBottom: '30px',
    fontWeight: 'bold'
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loader: {
    border: '4px solid #333',
    borderTop: '4px solid #FFD700',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#FFD700',
    marginTop: '20px',
    fontSize: '18px'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '12px 24px',
    border: '1px solid #FFD700',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '30px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
  },
  statIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  statValue: {
    color: '#FFD700',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  statLabel: {
    color: '#999',
    fontSize: '16px'
  },
  visitorBreakdown: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #333',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  visitorStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    textAlign: 'center'
  },
  visitorLabel: {
    color: '#999',
    fontSize: '13px'
  },
  visitorValue: {
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px'
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '25px',
    fontWeight: 'bold'
  },
  subsectionTitle: {
    color: '#FFD700',
    fontSize: '20px',
    marginTop: '25px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#0d0d0d',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #333'
  },
  activityIcon: {
    fontSize: '24px'
  },
  activityContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  activityName: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: '500'
  },
  activityDetail: {
    color: '#999',
    fontSize: '14px'
  },
  activityDate: {
    color: '#666',
    fontSize: '14px'
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 2fr 0.8fr 0.8fr 1fr 0.8fr',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    borderRadius: '10px',
    fontWeight: 'bold',
    color: '#FFD700'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 2fr 0.8fr 0.8fr 1fr 0.8fr',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    borderRadius: '10px',
    border: '1px solid #333',
    color: '#ccc',
    alignItems: 'center'
  },
  tableCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  analyticsCard: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '20px'
  },
  analyticsTitle: {
    color: '#FFD700',
    fontSize: '18px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  analyticsStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  analyticsStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  analyticsLabel: {
    color: '#999',
    fontSize: '14px'
  },
  analyticsValue: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  progressBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    color: '#000',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  detailsButton: {
    padding: '8px 16px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  expandedRow: {
    gridColumn: '1 / -1',
    backgroundColor: '#0d0d0d',
    border: '1px solid #FFD700',
    borderRadius: '10px',
    padding: '20px',
    marginTop: '10px',
    marginBottom: '10px'
  },
  expandedTitle: {
    color: '#FFD700',
    fontSize: '18px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  progressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  progressCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px'
  },
  progressCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid #333'
  },
  progressModuleTitle: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: '500'
  },
  progressPercentage: {
    fontSize: '20px',
    fontWeight: 'bold'
  },
  progressDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  progressDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  progressIcon: {
    fontSize: '18px'
  },
  progressDetailText: {
    color: '#ccc',
    fontSize: '14px'
  },
  noProgress: {
    color: '#999',
    fontSize: '16px',
    textAlign: 'center',
    padding: '20px'
  },
  settingsCard: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '30px',
    maxWidth: '600px'
  },
  settingsSubtitle: {
    color: '#FFD700',
    fontSize: '20px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  passwordForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '500'
  },
  passwordInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none'
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '5px'
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500'
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  onlineSubtitle: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '25px'
  },
  onlineUsersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  onlineUserCard: {
    backgroundColor: '#0d0d0d',
    border: '2px solid #4CAF50',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)'
  },
  onlineUserHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333'
  },
  onlineUserInfo: {
    flex: 1
  },
  onlineUserName: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  onlineStatus: {
    color: '#4CAF50',
    fontSize: '14px',
    fontWeight: 'normal'
  },
  onlineUserEmail: {
    color: '#999',
    fontSize: '14px'
  },
  locationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px'
  },
  locationIcon: {
    fontSize: '16px'
  },
  locationText: {
    color: '#4CAF50',
    fontSize: '13px',
    fontWeight: '500'
  },
  onlineUserActivity: {
    backgroundColor: '#1a1a1a',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  activityLabel: {
    color: '#999',
    fontSize: '12px',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  activityValue: {
    color: '#FFD700',
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  moduleActivityInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1
  },
  progressBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  progressBarBg: {
    flex: 1,
    height: '8px',
    backgroundColor: '#333',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '4px'
  },
  progressText: {
    color: '#FFD700',
    fontSize: '13px',
    fontWeight: 'bold',
    minWidth: '40px'
  },
  onlineUserTime: {
    color: '#666',
    fontSize: '13px',
    textAlign: 'right'
  },
  noOnlineUsers: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#0d0d0d',
    borderRadius: '12px',
    border: '1px solid #333'
  },
  noOnlineIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  noOnlineText: {
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  noOnlineSubtext: {
    color: '#999',
    fontSize: '14px'
  },
  adminManagementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px'
  },
  createAdminButton: {
    padding: '12px 24px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  adminsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  adminCard: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px'
  },
  adminCardHeader: {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333'
  },
  adminName: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  superAdminBadge: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  suspendedBadge: {
    backgroundColor: '#ff4444',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  adminEmail: {
    color: '#999',
    fontSize: '14px'
  },
  adminCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px'
  },
  adminInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  adminInfoLabel: {
    color: '#999',
    fontSize: '14px'
  },
  adminInfoValue: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '500'
  },
  suspendButton: {
    width: '100%',
    padding: '10px',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  adminActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  deleteButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#8B0000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: '24px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  passwordDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  passwordWarning: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  passwordBox: {
    backgroundColor: '#0d0d0d',
    border: '2px solid #FFD700',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center'
  },
  passwordLabel: {
    color: '#999',
    fontSize: '14px'
  },
  passwordValue: {
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    userSelect: 'all'
  },
  passwordNote: {
    color: '#999',
    fontSize: '14px',
    textAlign: 'center',
    fontStyle: 'italic'
  }
};

export default AdminDashboard;
