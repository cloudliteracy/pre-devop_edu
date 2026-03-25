import React, { useState } from 'react';
import axios from 'axios';

const TestimonialCard = ({ testimonial, isOwn, onUpdate }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/testimonials/${testimonial._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Testimonial deleted successfully');
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete testimonial');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ ...styles.star, color: i < rating ? '#FFD700' : '#333' }}>
        ★
      </span>
    ));
  };

  return (
    <div style={styles.card}>
      {testimonial.isFeatured && (
        <div style={styles.featuredBadge}>⭐ Featured</div>
      )}
      
      <div style={styles.header}>
        <div style={styles.userInfo}>
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
        {isOwn && (
          <div style={styles.actions}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={styles.deleteButton}
              title="Delete testimonial"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <p style={styles.text}>{testimonial.testimonialText}</p>

      <div style={styles.footer}>
        <span style={styles.date}>
          {new Date(testimonial.createdAt).toLocaleDateString()}
        </span>
      </div>

      {showDeleteConfirm && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmBox}>
            <p style={styles.confirmText}>Delete this testimonial?</p>
            <div style={styles.confirmButtons}>
              <button onClick={() => setShowDeleteConfirm(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleDelete} style={styles.confirmButton}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '25px',
    position: 'relative',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  },
  featuredBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
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
    fontSize: '20px'
  },
  actions: {
    display: 'flex',
    gap: '10px'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 0.3s'
  },
  text: {
    color: '#ccc',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '20px',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  },
  footer: {
    borderTop: '1px solid #333',
    paddingTop: '15px'
  },
  date: {
    color: '#666',
    fontSize: '13px'
  },
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  confirmBox: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '400px'
  },
  confirmText: {
    color: '#FFD700',
    fontSize: '18px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px'
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  confirmButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default TestimonialCard;
