import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Not Authenticated</h2>
          <p style={styles.text}>Please log in to view your profile.</p>
          <button style={styles.button} onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.imageContainer}>
            {user.profilePhoto ? (
              <img 
                src={`http://localhost:5000${user.profilePhoto.startsWith('/') ? '' : '/'}${user.profilePhoto.replace(/\\/g, '/')}`} 
                alt={`${user.name}'s profile`} 
                style={styles.profileImage} 
              />
            ) : (
              <div style={styles.profilePlaceholder}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 style={styles.name}>{user.name}</h1>
          <p style={styles.role}>{user.role.toUpperCase()}</p>
        </div>
        
        <div style={styles.detailsSection}>
          <div style={styles.detailRow}>
            <span style={styles.label}>Email Address</span>
            <span style={styles.value}>{user.email}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Account Type</span>
            <span style={styles.value}>{user.isCsrUser ? 'Corporate Social Responsibility (CSR)' : 'Standard User'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '60px',
    paddingBottom: '40px'
  },
  card: {
    backgroundColor: '#111',
    border: '1px solid #FFD700',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.1)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderBottom: '1px solid #333',
    paddingBottom: '25px',
    marginBottom: '25px'
  },
  imageContainer: {
    marginBottom: '20px'
  },
  profileImage: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #FFD700',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
  },
  profilePlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#FFD700',
    color: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '48px',
    fontWeight: 'bold',
    border: '4px solid #333'
  },
  name: {
    color: '#fff',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 5px 0'
  },
  role: {
    color: '#FFD700',
    fontSize: '14px',
    margin: 0,
    letterSpacing: '1px'
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    color: '#888',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  value: {
    color: '#fff',
    fontSize: '16px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  title: {
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: '20px'
  },
  text: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: '30px'
  },
  button: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default Profile;
