import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FeaturedTestimonials = ({ refreshKey = 0 }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedTestimonials();
  }, [refreshKey]);

  const fetchFeaturedTestimonials = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/testimonials/featured');
      // Group into rows of 5, unlimited rows
      const rows = [];
      for (let i = 0; i < data.length; i += 5) {
        rows.push(data.slice(i, i + 5));
      }
      setTestimonials(rows);
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
      <div style={styles.gridContainer}>
        {testimonials.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map(testimonial => (
              <div key={testimonial._id} style={styles.card}>
                <div style={styles.header}>
                  {testimonial.profilePhoto ? (
                    <img
                      src={`http://localhost:5000${testimonial.profilePhoto.startsWith('/') ? '' : '/'}${testimonial.profilePhoto.replace(/\\/g, '/')}`}
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
                  "{testimonial.testimonialText.length > 120 
                    ? testimonial.testimonialText.substring(0, 120) + '...' 
                    : testimonial.testimonialText}"
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
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
  gridContainer: {
    marginBottom: '30px'
  },
  row: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },

  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '4px',
    padding: '12px',
    transition: 'all 0.3s',
    height: '160px',
    width: '220px',
    margin: '0',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '15px'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #FFD700'
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#FFD700',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 'bold'
  },
  userName: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  rating: {
    display: 'flex',
    gap: '2px'
  },
  star: {
    fontSize: '14px'
  },
  text: {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.5',
    fontStyle: 'italic',
    flexGrow: 1
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
