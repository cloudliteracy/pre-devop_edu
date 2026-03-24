import React, { useState } from 'react';
import axios from 'axios';

const TestimonialForm = ({ onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [testimonialText, setTestimonialText] = useState('');
  // const [profilePhoto, setProfilePhoto] = useState(null); // Removed photo upload
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!testimonialText.trim()) {
      alert('Please write your testimonial');
      return;
    }

    if (testimonialText.length > 500) {
      alert('Testimonial must be 500 characters or less');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('testimonialText', testimonialText.trim());
      // Removed photo upload

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/testimonials', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Testimonial submitted successfully! It will be visible after admin approval.');
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  // Removed handleFileChange - no photo upload

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3 style={styles.title}>Share Your Experience</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Your Rating *</label>
          <div style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                style={{
                  ...styles.star,
                  color: star <= (hoverRating || rating) ? '#FFD700' : '#333'
                }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Your Testimonial * (Max 500 characters)</label>
          <textarea
            value={testimonialText}
            onChange={(e) => setTestimonialText(e.target.value)}
            placeholder="Share your experience with CloudLiteracy..."
            maxLength={500}
            rows={6}
            style={styles.textarea}
            required
          />
          <div style={styles.charCount}>
            {testimonialText.length}/500 characters
          </div>
        </div>

        {/* Photo upload removed */}

        <div style={styles.buttons}>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={styles.submitButton}>
            {submitting ? 'Submitting...' : 'Submit Testimonial'}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto 40px',
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  title: {
    color: '#FFD700',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '10px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  starsContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  star: {
    fontSize: '48px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none'
  },
  textarea: {
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  charCount: {
    color: '#999',
    fontSize: '13px',
    textAlign: 'right'
  },
  fileInput: {
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer'
  },
  filePreview: {
    color: '#4CAF50',
    fontSize: '14px',
    padding: '10px',
    backgroundColor: '#0d0d0d',
    borderRadius: '6px'
  },
  buttons: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px'
  },
  cancelButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  submitButton: {
    flex: 1,
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

export default TestimonialForm;
