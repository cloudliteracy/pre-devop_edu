import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.mainTitle}>Welcome to CloudLiteracy</h1>
        <h2 style={styles.subtitle}>Master Pre-DevOps - One Module at a Time</h2>
        <p style={styles.description}>
          Build a strong foundation with our comprehensive 7-module course.
          <br />
          Each module includes PDFs, videos, and interactive quizzes.
        </p>
        
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>📚</div>
            <h3 style={styles.featureTitle}>7 Modules</h3>
            <p style={styles.featureText}>Comprehensive curriculum</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🎥</div>
            <h3 style={styles.featureTitle}>Video Content</h3>
            <p style={styles.featureText}>Learn at your own pace</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>✅</div>
            <h3 style={styles.featureTitle}>Quizzes</h3>
            <p style={styles.featureText}>Test your knowledge</p>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <Link to="/modules" style={{ textDecoration: 'none' }}>
            <button style={styles.primaryButton}>
              Browse Modules
            </button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={styles.secondaryButton}>
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  hero: {
    textAlign: 'center',
    maxWidth: '900px'
  },
  mainTitle: {
    color: '#FFD700',
    fontSize: '56px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textShadow: '0 0 30px rgba(255, 215, 0, 0.4)'
  },
  subtitle: {
    color: '#FFD700',
    fontSize: '32px',
    fontWeight: '500',
    marginBottom: '25px'
  },
  description: {
    color: '#ccc',
    fontSize: '20px',
    lineHeight: '1.8',
    marginBottom: '50px'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '30px',
    marginBottom: '50px'
  },
  feature: {
    backgroundColor: '#1a1a1a',
    padding: '30px',
    borderRadius: '15px',
    border: '1px solid #333',
    transition: 'all 0.3s'
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  featureTitle: {
    color: '#FFD700',
    fontSize: '20px',
    marginBottom: '10px'
  },
  featureText: {
    color: '#999',
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '18px 45px',
    fontSize: '18px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
  },
  secondaryButton: {
    padding: '18px 45px',
    fontSize: '18px',
    backgroundColor: 'transparent',
    color: '#FFD700',
    border: '2px solid #FFD700',
    borderRadius: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default Home;
