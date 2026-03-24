import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AnnouncementBar from '../components/AnnouncementBar';
import HelpDeskButton from '../components/HelpDeskButton';
import FeaturedTestimonials from '../components/FeaturedTestimonials';

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [stats, setStats] = useState({ averageRating: 0, totalRatings: 0 });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchRatingStats();
  }, []);

  const fetchRatingStats = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/ratings/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch rating stats:', error);
    }
  };

  const handleRatingClick = async (value) => {
    if (!isAuthenticated) {
      alert('Please login to rate our platform');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/ratings',
        { rating: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(value);
      setSubmitted(true);
      fetchRatingStats();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };
  return (
    <div style={styles.container}>
      <AnnouncementBar />
      <HelpDeskButton />
      <div style={styles.contentWrapper}>
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
        </div>
      </div>

      {/* Rating Section */}
      <div style={styles.ratingSection}>
        <h2 style={styles.ratingTitle}>Rate Our Platform</h2>
        <p style={styles.ratingSubtitle}>Help us improve by sharing your experience</p>
        
        <div style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                ...styles.star,
                color: star <= (hoverRating || rating) ? '#FFD700' : '#333'
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRatingClick(star)}
            >
              ★
            </span>
          ))}
        </div>

        {submitted && (
          <div style={styles.thankYou}>Thank you for your rating! ❤️</div>
        )}

        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.averageRating}</span>
            <span style={styles.statLabel}>Average Rating</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.totalRatings}</span>
            <span style={styles.statLabel}>Total Ratings</span>
          </div>
        </div>
      </div>
      </div>

      {/* Featured Testimonials */}
      <FeaturedTestimonials />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    flexDirection: 'column'
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    gap: '60px',
    flex: 1
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
  },
  csrButton: {
    padding: '18px 45px',
    fontSize: '18px',
    backgroundColor: '#1a1a1a',
    color: '#FFD700',
    border: '2px solid #FFD700',
    borderRadius: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
  },
  ratingSection: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)'
  },
  ratingTitle: {
    color: '#FFD700',
    fontSize: '32px',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  ratingSubtitle: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '30px'
  },
  starsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  star: {
    fontSize: '60px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none'
  },
  thankYou: {
    color: '#4CAF50',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    animation: 'fadeIn 0.5s'
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '40px',
    marginTop: '30px',
    paddingTop: '30px',
    borderTop: '1px solid #333'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statValue: {
    color: '#FFD700',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  statLabel: {
    color: '#999',
    fontSize: '14px'
  },
  statDivider: {
    width: '1px',
    height: '50px',
    backgroundColor: '#333'
  }
};

export default Home;
