import React, { useState } from 'react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement actual email sending
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Contact Us</h1>
        <p style={styles.subtitle}>Have questions? We'd love to hear from you!</p>

        <div style={styles.grid}>
          <div style={styles.infoSection}>
            <h2 style={styles.infoTitle}>Get In Touch</h2>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>📧</span>
              <div>
                <div style={styles.infoLabel}>Email</div>
                <div style={styles.infoValue}>support@cloudliteracy.com</div>
              </div>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>📱</span>
              <div>
                <div style={styles.infoLabel}>Phone</div>
                <div style={styles.infoValue}>+237 XXX XXX XXX</div>
              </div>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>🌍</span>
              <div>
                <div style={styles.infoLabel}>Location</div>
                <div style={styles.infoValue}>Cameroon, Africa</div>
              </div>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>⏰</span>
              <div>
                <div style={styles.infoLabel}>Support Hours</div>
                <div style={styles.infoValue}>Mon-Fri: 9AM - 6PM WAT</div>
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            {submitted ? (
              <div style={styles.successMessage}>
                <div style={styles.successIcon}>✓</div>
                <h3 style={styles.successTitle}>Message Sent!</h3>
                <p style={styles.successText}>We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="Your full name"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="What is this about?"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    style={styles.textarea}
                    placeholder="Tell us more..."
                  />
                </div>
                <button type="submit" style={styles.submitButton}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    padding: '60px 20px'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    color: '#FFD700',
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  subtitle: {
    color: '#999',
    fontSize: '18px',
    textAlign: 'center',
    marginBottom: '50px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px'
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '40px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  },
  infoTitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '30px',
    fontWeight: 'bold'
  },
  infoItem: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    alignItems: 'flex-start'
  },
  infoIcon: {
    fontSize: '32px'
  },
  infoLabel: {
    color: '#999',
    fontSize: '14px',
    marginBottom: '5px'
  },
  infoValue: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: '500'
  },
  formSection: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '40px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    color: '#FFD700',
    fontSize: '16px',
    marginBottom: '8px',
    fontWeight: '500'
  },
  input: {
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none'
  },
  textarea: {
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  submitButton: {
    padding: '18px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px'
  },
  successMessage: {
    textAlign: 'center',
    padding: '40px'
  },
  successIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: '#fff',
    margin: '0 auto 20px',
    fontWeight: 'bold'
  },
  successTitle: {
    color: '#4CAF50',
    fontSize: '28px',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  successText: {
    color: '#999',
    fontSize: '16px'
  }
};

export default ContactUs;
