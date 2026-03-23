import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnnouncementManagement from '../components/AnnouncementManagement';

const Announcements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission
  const canManage = user?.isSuperAdmin || user?.canManageAnnouncements;

  if (!user || (!user.isSuperAdmin && user.role !== 'admin')) {
    navigate('/');
    return null;
  }

  if (!canManage) {
    return (
      <div style={styles.container}>
        <div style={styles.noAccess}>
          <h2 style={styles.noAccessTitle}>⚠️ Access Denied</h2>
          <p style={styles.noAccessText}>You don't have permission to manage announcements.</p>
          <p style={styles.noAccessSubtext}>Contact the super admin to request access.</p>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <AnnouncementManagement user={user} />
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
  noAccess: {
    maxWidth: '600px',
    margin: '100px auto',
    background: '#1a1a1a',
    border: '2px solid #ff4444',
    borderRadius: '15px',
    padding: '60px 40px',
    textAlign: 'center'
  },
  noAccessTitle: {
    color: '#ff4444',
    fontSize: '32px',
    marginBottom: '20px'
  },
  noAccessText: {
    color: '#fff',
    fontSize: '18px',
    marginBottom: '10px'
  },
  noAccessSubtext: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '30px'
  },
  backButton: {
    background: '#FFD700',
    color: '#000',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default Announcements;
