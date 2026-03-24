import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import TestimonialCard from '../components/TestimonialCard';
import TestimonialForm from '../components/TestimonialForm';

const Testimonials = () => {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterRating, setFilterRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userTestimonial, setUserTestimonial] = useState(null);

  useEffect(() => {
    fetchTestimonials();
    if (user) {
      checkUserTestimonial();
    }
  }, [filterRating, currentPage]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (filterRating !== 'all') {
        params.rating = filterRating;
      }

      const { data } = await axios.get('http://localhost:5000/api/testimonials', { params });
      setTestimonials(data.testimonials);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserTestimonial = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/testimonials', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const myTestimonial = data.testimonials.find(t => t.userId._id === user.id || t.userId._id === user._id);
      setUserTestimonial(myTestimonial);
    } catch (error) {
      console.error('Failed to check user testimonial:', error);
    }
  };

  const handleSubmitSuccess = () => {
    setShowForm(false);
    fetchTestimonials();
    checkUserTestimonial();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Testimonials</h1>
        <p style={styles.subtitle}>See what our learners are saying about CloudLiteracy</p>
      </div>

      {user && !userTestimonial && (
        <div style={styles.ctaSection}>
          <p style={styles.ctaText}>Share your experience with CloudLiteracy!</p>
          <button onClick={() => setShowForm(!showForm)} style={styles.ctaButton}>
            {showForm ? '✖ Cancel' : '✍️ Write a Testimonial'}
          </button>
        </div>
      )}

      {showForm && (
        <TestimonialForm onSuccess={handleSubmitSuccess} onCancel={() => setShowForm(false)} />
      )}

      <div style={styles.filterSection}>
        <label style={styles.filterLabel}>Filter by rating:</label>
        <div style={styles.filterButtons}>
          <button
            onClick={() => setFilterRating('all')}
            style={{
              ...styles.filterButton,
              ...(filterRating === 'all' ? styles.filterButtonActive : {})
            }}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              onClick={() => setFilterRating(rating)}
              style={{
                ...styles.filterButton,
                ...(filterRating === rating ? styles.filterButtonActive : {})
              }}
            >
              {rating} ⭐
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading testimonials...</div>
      ) : testimonials.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>💬</span>
          <p style={styles.emptyText}>No testimonials yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {testimonials.map(testimonial => (
              <TestimonialCard
                key={testimonial._id}
                testimonial={testimonial}
                isOwn={user && (testimonial.userId._id === user.id || testimonial.userId._id === user._id)}
                onUpdate={fetchTestimonials}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === 1 ? styles.pageButtonDisabled : {})
                }}
              >
                ← Previous
              </button>
              <span style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === totalPages ? styles.pageButtonDisabled : {})
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    padding: '40px 20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    color: '#FFD700',
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#999',
    fontSize: '18px'
  },
  ctaSection: {
    maxWidth: '800px',
    margin: '0 auto 40px',
    textAlign: 'center',
    padding: '30px',
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px'
  },
  ctaText: {
    color: '#FFD700',
    fontSize: '20px',
    marginBottom: '20px'
  },
  ctaButton: {
    padding: '15px 40px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  filterSection: {
    maxWidth: '1200px',
    margin: '0 auto 30px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap'
  },
  filterLabel: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '8px 16px',
    backgroundColor: '#1a1a1a',
    color: '#FFD700',
    border: '1px solid #FFD700',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
    color: '#000'
  },
  loading: {
    textAlign: 'center',
    color: '#FFD700',
    fontSize: '18px',
    padding: '60px'
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px'
  },
  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '20px'
  },
  emptyText: {
    color: '#999',
    fontSize: '18px'
  },
  grid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
    marginBottom: '40px'
  },
  pagination: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px'
  },
  pageButton: {
    padding: '10px 20px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  pageInfo: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};

export default Testimonials;
