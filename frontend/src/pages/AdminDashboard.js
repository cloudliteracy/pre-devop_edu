import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
                <div style={styles.tableCell}>Joined</div>
              </div>
              {users.map((user) => (
                <div key={user._id} style={styles.tableRow}>
                  <div style={styles.tableCell}>{user.name}</div>
                  <div style={styles.tableCell}>{user.email}</div>
                  <div style={styles.tableCell}>{user.purchasedModules.length}</div>
                  <div style={styles.tableCell}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
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
    marginBottom: '30px'
  },
  tab: {
    padding: '12px 30px',
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
    gridTemplateColumns: '2fr 2fr 1fr 1fr',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    borderRadius: '10px',
    fontWeight: 'bold',
    color: '#FFD700'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 1fr 1fr',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    borderRadius: '10px',
    border: '1px solid #333',
    color: '#ccc'
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
  }
};

export default AdminDashboard;
