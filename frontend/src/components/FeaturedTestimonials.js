import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const FeaturedTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedTestimonials();
  }, []);

  const fetchFeaturedTestimonials = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/testimonials/featured');
      setTestimonials(data);
    } catch (error) {
      console.error('Failed to fetch featured testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ ...styles.star, color: i < rating ? '#FFD700' : '#333' }}>
        ★
      </span>
    ));
  };

  if (loading || testimonials.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>What Our Learners Say</h2>
      <div style={styles.grid}>
        {testimonials.map(testimonial => (
          <div key={testimonial._id} style={styles.card}>
            <div style={styles.header}>
              {testimonial.profilePhoto ? (
                <img
                  src={`http://localhost:5000/${testimonial.profilePhoto}`}
                  alt={testimonial.userId.name}
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {testimonial.userId.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={styles.userName}>{testimonial.userId.name}</div>
                <div style={styles.rating}>{renderStars(testimonial.rating)}</div>
              </div>
            </div>
            <p style={styles.text}>
              "{testimonial.testimonialText.length > 150 
                ? testimonial.testimonialText.substring(0, 150) + '...' 
                : testimonial.testimonialText}"
            </p>
          </div>
        ))}
      </div>
      <div style={styles.linkContainer}>
        <Link to="/testimonials" style={styles.link}>
          View All Testimonials →
        </Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '60px auto',
    padding: '0 20px'
  },
  title: {
    color: '#FFD700',
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '40px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
    marginBottom: '30px'
  },
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '25px',
    transition: 'all 0.3s'
  },
  header: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginBottom: '20px'
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #FFD700'
  },
  avatarPlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#FFD700',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 'bold'
  },
  userName: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  rating: {
    display: 'flex',
    gap: '2px'
  },
  star: {
    fontSize: '16px'
  },
  text: {
    color: '#ccc',
    fontSize: '15px',
    lineHeight: '1.6',
    fontStyle: 'italic'
  },
  linkContainer: {
    textAlign: 'center'
  },
  link: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    textDecoration: 'none',
    transition: 'all 0.3s'
  }
};

export default FeaturedTestimonials;
